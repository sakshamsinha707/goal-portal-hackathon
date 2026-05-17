import { getAuditLogs } from "@/actions/admin";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AuditPage() {
  const logs = await getAuditLogs(100);

  return (
    <>
      <AppHeader title="Audit log" subtitle="Immutable activity trail" />
      <main className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent events ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 pr-4">When</th>
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50">
                      <td className="py-2 pr-4 text-slate-500">{formatDate(log.createdAt)}</td>
                      <td className="py-2 pr-4">{log.user.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{log.action}</td>
                      <td className="py-2">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
