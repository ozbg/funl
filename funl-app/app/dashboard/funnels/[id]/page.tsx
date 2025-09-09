import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { generateShortUrl } from '@/lib/qr'
import FunnelActions from '@/components/FunnelActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FunnelDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: funnel, error } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()

  if (error || !funnel) {
    return notFound()
  }

  const publicUrl = generateShortUrl(funnel.short_url)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{funnel.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(funnel.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              funnel.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {funnel.status}
            </span>
            <Link
              href={`/dashboard/funnels/${funnel.id}/edit`}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">QR Code</h2>
          
          {funnel.qr_code_url && (
            <div className="text-center">
              <div className="inline-block p-4 bg-white border rounded-lg">
                <Image
                  src={funnel.qr_code_url}
                  alt={`QR Code for ${funnel.name}`}
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">Short URL:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {publicUrl}
                  </code>
                  <FunnelActions 
                    funnelId={funnel.id}
                    currentStatus={funnel.status}
                    publicUrl={publicUrl}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <a
                  href={funnel.qr_code_url}
                  download={`${funnel.name.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Download QR Code
                </a>
                <Link
                  href={publicUrl}
                  target="_blank"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Preview Landing Page
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Funnel Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Funnel Details</h2>
          
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{funnel.type}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Print Size</dt>
              <dd className="mt-1 text-sm text-gray-900">{funnel.print_size}</dd>
            </div>

            {funnel.content?.headline && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Headline</dt>
                <dd className="mt-1 text-sm text-gray-900">{funnel.content.headline}</dd>
              </div>
            )}

            {funnel.content?.state && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Property State</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">
                  {funnel.content.state.replace('_', ' ')}
                </dd>
              </div>
            )}

            {funnel.content?.price && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Price</dt>
                <dd className="mt-1 text-sm text-gray-900">{funnel.content.price}</dd>
              </div>
            )}

            {funnel.content?.property_url && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Property Link</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a 
                    href={funnel.content.property_url} 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    View Property
                  </a>
                </dd>
              </div>
            )}

            {funnel.content?.video_url && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Video</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a 
                    href={funnel.content.video_url} 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    View Video
                  </a>
                </dd>
              </div>
            )}

            {funnel.content?.custom_message && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Custom Message</dt>
                <dd className="mt-1 text-sm text-gray-900">{funnel.content.custom_message}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
        
        <FunnelActions 
          funnelId={funnel.id}
          currentStatus={funnel.status}
        />
      </div>
    </div>
  )
}