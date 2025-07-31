'use client'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface PaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  itemName?: string // e.g., "leads", "notes", "follow-ups"
  limitOptions?: number[]
  showLimitSelector?: boolean
}

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  itemName = 'items',
  limitOptions = [5, 10, 25, 50, 100],
  showLimitSelector = true,
}: PaginationProps) {
  const goToFirstPage = () => onPageChange(1)
  const goToLastPage = () => onPageChange(pagination.pages)
  const goToPreviousPage = () => onPageChange(Math.max(1, pagination.page - 1))
  const goToNextPage = () => onPageChange(Math.min(pagination.pages, pagination.page + 1))

  if (pagination.total === 0) {
    return null
  }

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} {itemName}
            </span>
          </div>
          
          {/* Records per page selector */}
          {showLimitSelector && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show:</span>
              <Select 
                value={pagination.limit.toString()} 
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="h-8 w-20 text-sm"
              >
                {limitOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
              <span>per page</span>
            </div>
          )}
        </div>

        {/* Pagination buttons - only show when there are multiple pages */}
        {pagination.pages > 1 && (
          <div className="flex items-center gap-2">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={pagination.page === 1}
              className="h-8 w-8 p-0"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={pagination.page === 1}
              className="h-8 w-8 p-0"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum: number
                if (pagination.pages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pagination.page === pagination.pages}
              className="h-8 w-8 p-0"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={pagination.page === pagination.pages}
              className="h-8 w-8 p-0"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
