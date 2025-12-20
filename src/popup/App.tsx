import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">PseudoFill</h1>
            <span className="text-xs text-muted-foreground">Privacy-first forms</span>
          </div>
          <ModeToggle />
        </div>

        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <div className="flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                  <AvatarFallback>LR</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                  <AvatarFallback>ER</AvatarFallback>
                </Avatar>
              </div>
            </EmptyMedia>
            <EmptyTitle>No Pseudonym Personas Created</EmptyTitle>
            <EmptyDescription>Create one now to protect your privacy across websites.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={generatePseudonym}>
              <PlusIcon />
              Create Persona
            </Button>
          </EmptyContent>
        </Empty>

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
