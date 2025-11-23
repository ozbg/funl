'use client'

import { css } from '@/styled-system/css'

interface Plan {
  id: string
  name: string
}

interface EditPlanDialogProps {
  plan: Plan
  onSuccess: () => void
}

export function EditPlanDialog({ plan, onSuccess: _onSuccess }: EditPlanDialogProps) {
  return (
    <button
      onClick={() => window.location.href = `/admin/plans/${plan.id}/edit`}
      className={css({
        px: 3,
        py: 1,
        fontSize: 'xs',
        fontWeight: 'medium',
        color: 'blue.600',
        cursor: 'pointer',
        _hover: { textDecoration: 'underline' }
      })}
    >
      Edit
    </button>
  )
}
