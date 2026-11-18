import { useAuth } from '@/lib/auth'
import { useApi } from '@/lib/useApi'
import { NAV, NAV_TEMPLATE, type NavItem } from '@/config/nav'

/** Itens do menu para o usuario logado (Gestao so admin; Cameras so com camera cadastrada). */
export function useNavItems(): NavItem[] {
  const { isAdmin } = useAuth()
  const cameras = useApi<{ total?: number }>('/v1/cameras')
  const temCamera = (cameras.data?.total ?? 0) > 0
  const items = NAV.filter((i) => (i.when === 'admin' ? isAdmin : i.when === 'camera' ? temCamera : true))
  return import.meta.env.DEV ? [...items, NAV_TEMPLATE] : items
}
