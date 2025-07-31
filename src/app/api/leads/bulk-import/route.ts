import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { leadSchema } from '@/lib/validations'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ImportResult {
  success: boolean
  imported: number
  errors: Array<{
    row: number
    data: Record<string, unknown>
    error: string
  }>
  duplicates: Array<{
    row: number
    email: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const skipDuplicates = formData.get('skipDuplicates') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV or Excel files.' },
        { status: 400 }
      )
    }

    // Read file content
    const buffer = await file.arrayBuffer()
    let data: Record<string, unknown>[] = []

    if (fileExtension === 'csv') {
      // Parse CSV
      const text = new TextDecoder().decode(buffer)
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
      })
      data = parsed.data as Record<string, unknown>[]
    } else {
      // Parse Excel
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length < 2) {
        return NextResponse.json(
          { error: 'File must contain at least a header row and one data row' },
          { status: 400 }
        )
      }

      // Convert to object format with lowercase headers
      const headers = (jsonData[0] as string[]).map(h => h.toLowerCase().trim())
      data = jsonData.slice(1).map((row) => {
        const obj: Record<string, unknown> = {}
        headers.forEach((header, index) => {
          obj[header] = (row as unknown[])[index] || ''
        })
        return obj
      })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      )
    }

    // Process and validate data
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      duplicates: [],
    }

    // Get existing emails for duplicate checking (exclude empty emails)
    const existingLeads = await prisma.lead.findMany({
      where: {
        userId: user.userId,
        email: {
          not: null,
          notIn: [''],
        }
      },
      select: { email: true },
    })
    const existingEmails = new Set(existingLeads.map(lead => lead.email?.toLowerCase()).filter((email): email is string => email != null && email.trim() !== ''))

    const validLeads: Array<{
      name: string;
      location?: string;
      phone?: string;
      email?: string;
      website?: string;
      notes?: string;
      source?: string;
      status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';
      userId: string;
    }> = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // Account for header row and 0-based index

      try {
        // Map common field variations
        const mappedData = {
          name: String(row.name || row.fullname || row['full name'] || row['lead name'] || ''),
          location: String(row.location || row.address || row.city || row.region || ''),
          phone: String(row.phone || row.telephone || row['phone number'] || row.mobile || ''),
          email: String(row.email || row['email address'] || row.mail || ''),
          website: String(row.website || row.url || row['web site'] || row.site || ''),
          notes: String(row.notes || row.note || row.comments || row.description || ''),
          source: String(row.source || row.origin || row.channel || ''),
          status: 'NEW' as const,
        }

        // Validate the mapped data
        const validatedData = leadSchema.parse(mappedData)

        // Check for duplicates (only if email is provided and not empty)
        if (validatedData.email && validatedData.email.trim() !== '') {
          const emailLower = validatedData.email.toLowerCase()
          if (existingEmails.has(emailLower)) {
            result.duplicates.push({
              row: rowNumber,
              email: validatedData.email,
            })

            if (!skipDuplicates) {
              result.errors.push({
                row: rowNumber,
                data: row,
                error: `Email ${validatedData.email} already exists`,
              })
              continue
            }
          } else {
            // Add to existing emails set to prevent duplicates within the import
            existingEmails.add(emailLower)
          }
        }

        // Add valid lead to import list
        validLeads.push({
          ...validatedData,
          userId: user.userId,
        })
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : 'Invalid data format',
        })
      }
    }

    // Import valid leads in batches
    if (validLeads.length > 0) {
      try {
        await prisma.lead.createMany({
          data: validLeads,
          skipDuplicates: true,
        })
        result.imported = validLeads.length
      } catch (error) {
        console.error('Database import error:', error)
        return NextResponse.json(
          { error: 'Failed to import leads to database' },
          { status: 500 }
        )
      }
    }

    // Set success status
    result.success = result.errors.length === 0 || result.imported > 0

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
