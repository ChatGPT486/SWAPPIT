import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

function Boot() {
  useEffect(() => {
  const observe = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal:not(.revealed)').forEach(el => observer.observe(el))
    return observer
  }

  let observer = observe()

  // Re-observe when new elements are added to the DOM
  const mutationObserver = new MutationObserver(() => {
    observer.disconnect()
    observer = observe()
  })

  mutationObserver.observe(document.body, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    mutationObserver.disconnect()
  }
}, [])

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boot />
  </StrictMode>
)
