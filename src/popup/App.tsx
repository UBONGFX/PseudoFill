import { useState } from 'react'

function App() {
  const [pseudonym, setPseudonym] = useState<string>('')

  const generatePseudonym = async () => {
    // Get current tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const domain = new URL(tab.url || '').hostname
    
    // Simple pseudonym generation (to be enhanced)
    const pseudo = `user_${domain.replace(/\./g, '_')}_${Math.random().toString(36).substring(7)}`
    setPseudonym(pseudo)
  }

  return (
    <div className="w-[400px] min-h-[300px] p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">PseudoFill</h1>
          <span className="text-xs text-muted-foreground">Privacy-first forms</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Generate site-specific pseudonyms for form filling
        </p>

        <button
          onClick={generatePseudonym}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Generate Pseudonym
        </button>

        {pseudonym && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-mono break-all">{pseudonym}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
