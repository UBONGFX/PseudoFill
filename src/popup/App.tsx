import { useState } from 'react'
import {
  PlusIcon,
  ArrowLeft,
  Copy,
  CheckIcon,
  Mail,
  User,
  Phone,
  Calendar,
  MapPin,
  Save,
  Trash2,
} from 'lucide-react'
import { ModeToggle } from '../components/mode-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { generatePersona, type Persona } from '@/lib/persona-generator'

function App() {
  const [persona, setPersona] = useState<Persona | null>(null)
  const [copiedField, setCopiedField] = useState<string>('')
  const [showPersona, setShowPersona] = useState(false)

  const generateNewPersona = async () => {
    // Get current tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const domain = new URL(tab.url || '').hostname

    const newPersona = generatePersona(domain)
    setPersona(newPersona)
    setShowPersona(true)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const goBack = () => {
    setShowPersona(false)
    setPersona(null)
  }

  const savePersona = () => {
    // TODO: Implement save functionality
    console.log('Saving persona:', persona)
  }

  const deletePersona = () => {
    setShowPersona(false)
    setPersona(null)
  }

  if (showPersona && persona) {
    return (
      <div className="w-[400px] h-[650px] p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={deletePersona}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button> */}
              <Button variant="ghost" size="sm" onClick={savePersona}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Avatar className="h-20 w-20 mx-auto border-4 border-primary/20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {persona.firstName[0]}
                  {persona.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{persona.fullName}</h2>
              <p className="text-xs text-muted-foreground">Your privacy-protected persona</p>
            </div>

            <div className="space-y-2">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">First Name</p>
                    <p className="text-sm">{persona.firstName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(persona.firstName, 'firstName')}
                  >
                    {copiedField === 'firstName' ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Last Name</p>
                    <p className="text-sm">{persona.lastName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(persona.lastName, 'lastName')}
                  >
                    {copiedField === 'lastName' ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-mono truncate">{persona.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Username */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="text-sm font-mono truncate">{persona.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.username, 'username')}
                >
                  {copiedField === 'username' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-mono">{persona.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.phone, 'phone')}
                >
                  {copiedField === 'phone' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Date of Birth */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-mono">{persona.dateOfBirth}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.dateOfBirth, 'dob')}
                >
                  {copiedField === 'dob' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{persona.address.street}</p>
                  <p className="text-sm">
                    {persona.address.city}, {persona.address.state} {persona.address.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{persona.address.country}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.address.full, 'address')}
                >
                  {copiedField === 'address' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-center text-muted-foreground">
                Click any <Copy className="h-3 w-3 inline" /> icon to copy
              </p>
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
            <Button size="sm" onClick={generateNewPersona}>
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
