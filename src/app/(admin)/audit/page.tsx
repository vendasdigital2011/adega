"use client"

import React, { useState } from "react"
import { FileClock, FileSpreadsheet, Eye } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Select } from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { Loading } from "@/components/ui/Loading"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { Modal } from "@/components/ui/Modal"
import { Pagination } from "@/components/ui/Pagination"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { usePermission } from "@/hooks/usePermission"
import { usePagination } from "@/hooks/usePagination"
import { formatDateTime } from "@/utils/format"
import { exportToCsv, ExportColumn } from "@/utils/export"
import { useAuditLogs, useAuditUsers } from "@/features/audit/hooks/useAudit"
import { AUDIT_ACTIONS, AUDIT_TABLES, actionLabel, tableLabel } from "@/features/audit/utils"
import { AuditLog } from "@/types"

function firstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function AuditPage() {
  const canView = usePermission("audit.view")

  const [action, setAction] = useState("all")
  const [tableName, setTableName] = useState("all")
  const [userId, setUserId] = useState("all")
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const pagination = usePagination({ initialLimit: 20 })
  const { data: users } = useAuditUsers()
  const { data, isLoading } = useAuditLogs({
    action: action === "all" ? undefined : action,
    tableName: tableName === "all" ? undefined : tableName,
    userId: userId === "all" ? undefined : userId,
    startDate,
    endDate,
    page: pagination.page,
    limit: pagination.limit,
  })

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Volta para a página 1 sempre que um filtro muda.
  React.useEffect(() => {
    pagination.setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, tableName, userId, startDate, endDate])

  const logs = data?.data || []

  const csvColumns: ExportColumn<AuditLog>[] = [
    { header: "Data/Hora", value: (l) => formatDateTime(l.created_at) },
    { header: "Usuário", value: (l) => l.user?.name || "-" },
    { header: "Ação", value: (l) => actionLabel(l.action).label },
    { header: "Módulo", value: (l) => tableLabel(l.table_name) },
    { header: "Registro", value: (l) => l.record_id || "-" },
    { header: "IP", value: (l) => l.ip || "-" },
    { header: "Valores anteriores", value: (l) => (l.old_data ? JSON.stringify(l.old_data) : "-") },
    { header: "Valores atuais", value: (l) => (l.new_data ? JSON.stringify(l.new_data) : "-") },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground">Registro de todas as operações do sistema — quem fez, quando e o quê.</p>
      </div>

      {!canView ? (
        <Card className="bg-card/30 border-border/40">
          <CardContent className="py-8 text-center text-muted-foreground">
            Você não tem permissão para ver os logs de auditoria.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/30 border-border/40">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <Select
                  label="Ação"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  options={[{ value: "all", label: "Todas as ações" }, ...AUDIT_ACTIONS]}
                />
                <Select
                  label="Módulo"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  options={[{ value: "all", label: "Todos os módulos" }, ...AUDIT_TABLES]}
                />
                <Select
                  label="Usuário"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  options={[
                    { value: "all", label: "Todos os usuários" },
                    ...(users || []).map((u) => ({ value: u.id, label: u.name })),
                  ]}
                />
                <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCsv(csvColumns, logs, "auditoria")}
                disabled={logs.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
            </div>

            {isLoading ? (
              <Loading />
            ) : logs.length === 0 ? (
              <EmptyState icon={FileClock} title="Nenhum registro encontrado" description="Ajuste os filtros ou o período." />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l) => {
                      const meta = actionLabel(l.action)
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(l.created_at)}</TableCell>
                          <TableCell className="font-medium">
                            {l.user?.name || "—"}
                            {l.user?.email && <span className="block text-xs text-muted-foreground">{l.user.email}</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{tableLabel(l.table_name)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelected(l)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.setPage}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      <AuditDetailsModal log={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function AuditDetailsModal({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null
  const meta = actionLabel(log.action)

  return (
    <Modal isOpen={!!log} onClose={onClose} title="Detalhes do registro" size="lg">
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data/Hora" value={formatDateTime(log.created_at)} />
          <Field label="Usuário" value={log.user?.name || "—"} />
          <div>
            <p className="text-muted-foreground">Ação</p>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <Field label="Módulo" value={tableLabel(log.table_name)} />
          <Field label="Registro" value={log.record_id || "—"} />
          <Field label="IP" value={log.ip || "—"} />
        </div>

        <JsonBlock title="Valores anteriores" data={log.old_data} />
        <JsonBlock title="Valores atuais" data={log.new_data} />
      </div>
    </Modal>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

function JsonBlock({ title, data }: { title: string; data: Record<string, any> | null }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1">{title}</p>
      {data ? (
        <pre className="max-h-60 overflow-auto rounded-md border border-border/40 bg-muted/30 p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-muted-foreground">—</p>
      )}
    </div>
  )
}
