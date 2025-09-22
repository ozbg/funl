'use client'

import { useState } from 'react'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'

interface VideoPlayerProps {
  videoUrl: string
  autoPlay?: boolean
  onPlay?: () => void
}

export function VideoPlayer({ videoUrl, autoPlay = false, onPlay }: VideoPlayerProps) {
  const [isVideoVisible, setIsVideoVisible] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleShowVideo = () => {
    setIsVideoVisible(true)
    onPlay?.()
  }

  const getEmbedUrl = (url: string): string => {
    // Handle YouTube URLs
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      if (videoId) {
        const autoPlayParam = autoPlay ? '&autoplay=1' : ''
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1${autoPlayParam}`
      }
    }

    // Handle YouTube short URLs
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      if (videoId) {
        const autoPlayParam = autoPlay ? '&autoplay=1' : ''
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1${autoPlayParam}`
      }
    }

    // Handle Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      if (videoId) {
        const autoPlayParam = autoPlay ? '&autoplay=1' : ''
        return `https://player.vimeo.com/video/${videoId}?enablejsapi=1${autoPlayParam}`
      }
    }

    // Return original URL if not a supported platform
    return url
  }

  const isEmbeddableVideo = (url: string): boolean => {
    return url.includes('youtube.com') ||
           url.includes('youtu.be') ||
           url.includes('vimeo.com')
  }

  if (!isVideoVisible) {
    return (
      <button
        onClick={handleShowVideo}
        className={css({
          w: 'full',
          colorPalette: 'red',
          bg: 'colorPalette.default',
          color: 'colorPalette.fg',
          fontWeight: 'semibold',
          py: 4, // Match call button height
          px: 6, // Match call button padding
          fontSize: 'lg', // Match call button font size
          textAlign: 'center',
          transition: 'colors',
          _hover: {
            bg: 'colorPalette.emphasized'
          }
        })}
      >
        ▶️ Watch Video
      </button>
    )
  }

  if (hasError || !isEmbeddableVideo(videoUrl)) {
    return (
      <Box>
        <button
          onClick={handleShowVideo}
          className={css({
            w: 'full',
            colorPalette: 'red',
            bg: 'colorPalette.default',
            color: 'colorPalette.fg',
            fontWeight: 'semibold',
            py: 4,
            px: 6,
            fontSize: 'lg',
            textAlign: 'center',
            transition: 'colors',
            _hover: {
              bg: 'colorPalette.emphasized'
            }
          })}
        >
          ▶️ Watch Video
        </button>
        <Box mt={4} p={4} bg="bg.subtle" rounded="md">
          <p className={css({ fontSize: 'sm', color: 'fg.muted', textAlign: 'center', mb: 3 })}>
            Video player not available for this link
          </p>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              display: 'block',
              w: 'full',
              bg: 'accent.default',
              color: 'accent.fg',
              py: 2,
              px: 4,
              rounded: 'md',
              textAlign: 'center',
              fontWeight: 'medium',
              transition: 'colors',
              _hover: {
                bg: 'accent.emphasized'
              }
            })}
          >
            🔗 Open Video in New Tab
          </a>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <button
        onClick={() => setIsVideoVisible(false)}
        className={css({
          w: 'full',
          colorPalette: 'gray',
          bg: 'colorPalette.subtle',
          color: 'colorPalette.fg',
          fontWeight: 'medium',
          py: 2,
          px: 4,
          fontSize: 'sm',
          textAlign: 'center',
          transition: 'colors',
          _hover: {
            bg: 'colorPalette.muted'
          }
        })}
      >
        ✕ Close Video
      </button>

      <Box
        mt={3}
        position="relative"
        paddingBottom="56.25%" // 16:9 aspect ratio
        height={0}
        overflow="hidden"
        rounded="md"
        bg="bg.muted"
      >
        <iframe
          src={getEmbedUrl(videoUrl)}
          title="Video Player"
          className={css({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            rounded: 'md'
          })}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      </Box>
    </Box>
  )
}