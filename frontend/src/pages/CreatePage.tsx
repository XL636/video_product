import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageToVideoForm } from '@/components/generation/ImageToVideoForm'
import { TextToVideoForm } from '@/components/generation/TextToVideoForm'
import { VideoToAnimeForm } from '@/components/generation/VideoToAnimeForm'
import { JobQueue } from '@/components/queue/JobQueue'
import { Image, Type, Film, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CreatePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'img2vid'

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value })
  }

  return (
    <div className="flex flex-col h-full lg:flex-row">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 lg:mb-6 w-full justify-start gap-1 bg-slate-900/50 p-1 overflow-x-auto">
            <TabsTrigger value="img2vid" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Image to Video</span>
              <span className="sm:hidden">Img2Vid</span>
            </TabsTrigger>
            <TabsTrigger value="txt2vid" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Text to Video</span>
              <span className="sm:hidden">Txt2Vid</span>
            </TabsTrigger>
            <TabsTrigger value="vid2anime" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Film className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Video to Anime</span>
              <span className="sm:hidden">Vid2Anime</span>
            </TabsTrigger>
            <TabsTrigger value="story" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Story Mode</span>
              <span className="sm:hidden">Story</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="img2vid">
            <Card className="border-slate-800 bg-slate-900/30">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Image to Video</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageToVideoForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="txt2vid">
            <Card className="border-slate-800 bg-slate-900/30">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Text to Video</CardTitle>
              </CardHeader>
              <CardContent>
                <TextToVideoForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vid2anime">
            <Card className="border-slate-800 bg-slate-900/30">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Video to Anime</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoToAnimeForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="story">
            <Card className="border-slate-800 bg-slate-900/30">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Story Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Story mode is available in{' '}
                    <a href="/studio" className="text-primary underline">
                      Studio
                    </a>{' '}
                    page for full experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Sidebar - Job Queue */}
      <div className="hidden w-full border-t border-slate-800 lg:block lg:w-80 lg:border-t-0 lg:border-l">
        <JobQueue />
      </div>
    </div>
  )
}
