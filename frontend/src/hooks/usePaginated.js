import { useCallback, useEffect, useState } from 'react'

// Hook para listados con paginación real del servidor (page/size/search
// se envían a la API en cada carga). fetcher({page,size,search,...extra})
// debe devolver { items, totalElements, totalPages, page }.
export function usePaginated(fetcher, { size = 10, extra = {} } = {}) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [state, setState] = useState({ status: 'loading', items: [], totalElements: 0, totalPages: 1, error: '' })
  const extraKey = JSON.stringify(extra)

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 400); return () => clearTimeout(t) }, [search])
  useEffect(() => { setPage(0) }, [debounced, extraKey])

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }))
    try {
      const data = await fetcher({ page, size, search: debounced, ...JSON.parse(extraKey) })
      setState({ status: 'ready', items: data.items, totalElements: data.totalElements, totalPages: data.totalPages, error: '' })
    } catch (e) {
      setState((s) => ({ ...s, status: 'error', error: e.message }))
    }
  }, [fetcher, page, size, debounced, extraKey])

  useEffect(() => { load() }, [load])
  return { ...state, page, setPage, search, setSearch, reload: load }
}
