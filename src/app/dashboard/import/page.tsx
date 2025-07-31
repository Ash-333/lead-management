'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react'

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

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setResult(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('skipDuplicates', skipDuplicates.toString())

      const response = await fetch('/api/leads/bulk-import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Import error:', error)
      setResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, data: {}, error: 'Failed to upload file' }],
        duplicates: [],
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadSampleCSV = () => {
    const csvContent = `name,location,phone,email,website,notes,source
John Doe,"New York, NY",+1234567890,john@example.com,https://johndoe.com,Interested in premium package,Website
Jane Smith,"Los Angeles, CA",+0987654321,jane@example.com,,Referred by existing customer,Referral
Bob Johnson,"Chicago, IL",,bob@example.com,https://bobjohnson.biz,Follow up next week,Cold Call`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-leads.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Import Leads</h1>
        <Button variant="outline" onClick={downloadSampleCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download Sample CSV
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with your lead data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Supported Columns:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>name</strong> - Lead&apos;s full name (required)</li>
              <li>• <strong>location</strong> - Location/address (optional)</li>
              <li>• <strong>phone</strong> - Phone number (optional)</li>
              <li>• <strong>email</strong> - Email address (required)</li>
              <li>• <strong>website</strong> - Website URL (optional)</li>
              <li>• <strong>notes</strong> - Additional notes (optional)</li>
              <li>• <strong>source</strong> - Lead source (optional)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Supported Formats:</h4>
            <p className="text-sm text-muted-foreground">
              CSV (.csv), Excel (.xlsx, .xls)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {file ? (
              <div>
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium">Drop your file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="skipDuplicates" className="text-sm">
                  Skip duplicate emails (recommended)
                </label>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
              >
                {importing ? 'Importing...' : 'Import Leads'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.imported}
                </div>
                <div className="text-sm text-muted-foreground">
                  Successfully Imported
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.duplicates.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Duplicates Found
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Errors
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Errors
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded">
                      <strong>Row {error.row}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.duplicates.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Duplicates {skipDuplicates ? '(Skipped)' : '(Failed)'}
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.duplicates.map((duplicate, index) => (
                    <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                      <strong>Row {duplicate.row}:</strong> {duplicate.email} already exists
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.success && result.imported > 0 && (
              <div className="text-center">
                <Badge className="bg-green-500 text-white">
                  Import completed successfully!
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
