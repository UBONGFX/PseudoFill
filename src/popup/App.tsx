import { useState } from 'react'
import { PlusIcon, ArrowLeft, Copy, CheckIcon } from 'lucide-react'
import { ModeToggle } from '../components/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

function App() {
  const [pseudonym, setPseudonym] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [showPersona, setShowPersona] = useState(false)

  const generatePseudonym = async () => {
    // Get current tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const domain = new URL(tab.url || '').hostname

    // Simple pseudonym generation (to be enhanced)
    const pseudo = `user_${domain.replace(/\./g, '_')}_${Math.random().toString(36).substring(7)}`
    setPseudonym(pseudo)
    setShowPersona(true)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(pseudonym)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goBack = () => {
    setShowPersona(false)
    setPseudonym('')
  }

  if (showPersona && pseudonym) {
    return (
      <div className="w-[400px] min-h-[300px] p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <ModeToggle />
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Persona Created</h2>
              <p className="text-sm text-muted-foreground">Your unique pseudonym for this site</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {pseudonym.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="w-full space-y-2">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono break-all text-center">{pseudonym}</p>
                </div>

                <Button className="w-full" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <h3 className="font-semibold text-sm">Persona Details</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Use this for form filling</p>
                <p>• Unique to this website</p>
                <p>• Protects your real identity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[400px] min-h-[300px] p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">PseudoFill</h1>
          </div>
          <ModeToggle />
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <div className="flex -space-x-2">
                <Avatar className="h-12 w-12 border-2 border-background grayscale">
                  <AvatarFallback>TL</AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12 border-2 border-background grayscale">
                  <AvatarFallback>JI</AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12 border-2 border-background grayscale">
                  <AvatarFallback>CW</AvatarFallback>
                </Avatar>
              </div>
            </EmptyMedia>
            <EmptyTitle>No Pseudonym Personas Created</EmptyTitle>
            <EmptyDescription>
              Create one now to protect your privacy across websites.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={generatePseudonym}>
              <PlusIcon />
              Create Persona
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  )
}

export default App
