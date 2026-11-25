import { useEffect } from 'react'
import { getApiDocsUrl } from '../../lib/api-config'

export function DocsRedirect() {
  const docsUrl = getApiDocsUrl(import.meta.env.VITE_API_URL)

  useEffect(() => {
    window.location.replace(docsUrl)
  }, [docsUrl])

  return <main className="p-8 text-center">
    <p>Redirecionando para a documentação da API...</p>
    <a className="text-brand-700 underline" href={docsUrl}>Se não redirecionar, abra a documentação</a>
  </main>
}
