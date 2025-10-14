import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import type { IFilterParams, IDoesFilterPassParams, IFilterComp } from 'ag-grid-community'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface CustomSetFilterProps extends IFilterParams {
  values?: string[]
}

export const CustomSetFilter = forwardRef<IFilterComp, CustomSetFilterProps>((props, ref) => {
  const [searchText, setSearchText] = useState('')
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
  const [allValues, setAllValues] = useState<string[]>([])
  const guiRef = React.useRef<HTMLDivElement>(null)

  // Extract distinct values from the column
  useEffect(() => {
    const values = new Set<string>()

    props.api.forEachNode((node) => {
      const value = props.getValue(node)
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value))
      }
    })

    const sortedValues = Array.from(values).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    )
    setAllValues(sortedValues)
  }, [props])

  // Filter values based on search text
  const filteredValues = useMemo(() => {
    if (!searchText.trim()) return allValues
    const search = searchText.toLowerCase()
    return allValues.filter(value =>
      value.toLowerCase().includes(search)
    )
  }, [allValues, searchText])

  // Check if all filtered values are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredValues.length === 0) return false
    return filteredValues.every(value => selectedValues.has(value))
  }, [filteredValues, selectedValues])

  // Toggle select all filtered values
  const toggleSelectAll = () => {
    const newSelected = new Set(selectedValues)

    if (allFilteredSelected) {
      // Deselect all filtered
      filteredValues.forEach(value => newSelected.delete(value))
    } else {
      // Select all filtered
      filteredValues.forEach(value => newSelected.add(value))
    }

    setSelectedValues(newSelected)
    props.filterChangedCallback()
  }

  // Toggle individual value
  const toggleValue = (value: string) => {
    const newSelected = new Set(selectedValues)

    if (newSelected.has(value)) {
      newSelected.delete(value)
    } else {
      newSelected.add(value)
    }

    setSelectedValues(newSelected)
    props.filterChangedCallback()
  }

  // Clear all selections
  const clearAll = () => {
    setSelectedValues(new Set())
    setSearchText('')
    props.filterChangedCallback()
  }

  // AG Grid filter interface methods
  useImperativeHandle(ref, () => ({
    doesFilterPass(params: IDoesFilterPassParams) {
      if (selectedValues.size === 0) return true

      const value = String(props.getValue(params.node))
      return selectedValues.has(value)
    },

    isFilterActive() {
      return selectedValues.size > 0 && selectedValues.size < allValues.length
    },

    getModel() {
      if (selectedValues.size === 0 || selectedValues.size === allValues.length) {
        return null
      }
      return {
        filterType: 'set',
        values: Array.from(selectedValues),
      }
    },

    setModel(model: { filterType?: string; values?: string[] } | null) {
      if (model === null || model === undefined) {
        setSelectedValues(new Set())
      } else if (model.values) {
        setSelectedValues(new Set(model.values))
      }
    },

    getGui() {
      return guiRef.current!
    },
  }))

  return (
    <div ref={guiRef} className="ag-custom-component-popup" style={{
      width: '280px',
      padding: '12px',
      backgroundColor: 'white',
      border: '1px solid #d0d5dd',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      {/* Search input */}
      <div style={{ marginBottom: '8px' }}>
        <Input
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* Select All / Clear All */}
      <div style={{
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
      }}>
        <Button
          onClick={toggleSelectAll}
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
        >
          {allFilteredSelected ? 'Deselect All' : 'Select All'}
        </Button>
        <Button
          onClick={clearAll}
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
        >
          Clear
        </Button>
      </div>

      {/* Values list */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {filteredValues.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '12px',
          }}>
            No values found
          </div>
        ) : (
          filteredValues.map((value) => (
            <div
              key={value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 4px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '13px',
              }}
              className="hover:bg-gray-100"
              onClick={() => toggleValue(value)}
            >
              <Checkbox
                checked={selectedValues.has(value)}
                onCheckedChange={() => toggleValue(value)}
                className="mr-2"
              />
              <span style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {value}
              </span>
              {selectedValues.has(value) && (
                <span style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  marginLeft: '4px',
                }}>
                  ✓
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Count indicator */}
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '11px',
        color: '#6b7280',
        textAlign: 'center',
      }}>
        {selectedValues.size === 0
          ? 'All values shown'
          : selectedValues.size === allValues.length
          ? 'All values selected'
          : `${selectedValues.size} of ${allValues.length} selected`}
      </div>
    </div>
  )
})

CustomSetFilter.displayName = 'CustomSetFilter'
