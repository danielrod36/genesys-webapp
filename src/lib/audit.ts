import prisma from '@/lib/prisma'
import type { ActionType } from '@prisma/client'

/**
 * Records an audit entry for an operation.  The diff field is optional and
 * should contain a JSON patch or changed properties.
 */
export async function createAuditEntry({
  userId,
  entityType,
  entityId,
  action,
  diff,
}: {
  userId: string
  entityType: string
  entityId: string
  action: ActionType
  diff?: any
}) {
  try {
    await prisma.auditEntry.create({
      data: {
        userId,
        entityType,
        entityId,
        action,
        diff: diff ?? {},
      },
    })
  } catch (e) {
    console.error('Failed to record audit entry', e)
  }
}

/**
 * Returns a simple diff object representing changed fields between two objects.
 */
export function diffObjects(oldObj: any, newObj: any) {
  const diff: Record<string, any> = {}
  Object.keys(newObj).forEach((key) => {
    if (JSON.stringify(oldObj?.[key]) !== JSON.stringify(newObj[key])) {
      diff[key] = { before: oldObj?.[key], after: newObj[key] }
    }
  })
  return diff
}