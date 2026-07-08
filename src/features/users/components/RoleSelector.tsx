import { Select, SelectProps } from "@/components/ui/Select"
import { useRoles } from "../hooks/useRoles"

type RoleSelectorProps = Omit<SelectProps, "options">

export function RoleSelector(props: RoleSelectorProps) {
  const { data: roles, isLoading } = useRoles()

  const options = isLoading
    ? [{ value: "", label: "Carregando..." }]
    : [
        { value: "", label: "Selecione um perfil" },
        ...(roles || []).map((role) => ({ value: role.id, label: role.name })),
      ]

  return <Select options={options} {...props} />
}
