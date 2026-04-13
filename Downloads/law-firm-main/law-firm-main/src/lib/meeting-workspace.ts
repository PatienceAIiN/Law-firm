import { prisma } from './prisma'

export type MeetingStorageMode = 'SERVER' | 'BROWSER' | 'BOTH' | 'GOOGLE_DRIVE'

export type MeetingConfig = {
  storageMode: MeetingStorageMode
  localSavePath: string
  googleDriveFolderId: string
  allowRecording: boolean
  autoUploadToServer: boolean
  autoDownloadToBrowser: boolean
  fullScreenByDefault: boolean
  preferEmbeddedView: boolean
  sameTabOnly: boolean
}

export type MeetingRecordingEntry = {
  id: string
  bookingId: string
  fileName: string
  filePath: string
  publicUrl: string | null
  size: number
  storage: string
  status: 'completed' | 'failed'
  createdAt: string
}

export const DEFAULT_MEETING_CONFIG: MeetingConfig = {
  storageMode: 'SERVER',
  localSavePath: 'public/meeting-recordings',
  googleDriveFolderId: '',
  allowRecording: true,
  autoUploadToServer: true,
  autoDownloadToBrowser: false,
  fullScreenByDefault: true,
  preferEmbeddedView: true,
  sameTabOnly: true,
}

function parseJson<T>(value: string | null | undefined, fallback: T) {
  if (!value) return fallback
  try {
    return { ...fallback, ...JSON.parse(value) } as T
  } catch {
    return fallback
  }
}

export async function getMeetingConfig(): Promise<MeetingConfig> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'meeting_config' },
  })

  return parseJson(setting?.value, DEFAULT_MEETING_CONFIG)
}

export async function getMeetingRecordings(): Promise<MeetingRecordingEntry[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'meeting_recordings' },
  })

  const parsed = parseJson(setting?.value, { items: [] as MeetingRecordingEntry[] })
  return Array.isArray(parsed.items) ? parsed.items : []
}

export async function appendMeetingRecording(recording: MeetingRecordingEntry) {
  const items = await getMeetingRecordings()
  const next = [recording, ...items]

  await prisma.siteSetting.upsert({
    where: { key: 'meeting_recordings' },
    update: { value: JSON.stringify({ items: next }) },
    create: { key: 'meeting_recordings', value: JSON.stringify({ items: next }) },
  })
}

export async function getBookingWithSlot(bookingId: string) {
  return prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    include: {
      slot: {
        include: {
          day: true,
        },
      },
    },
  })
}
