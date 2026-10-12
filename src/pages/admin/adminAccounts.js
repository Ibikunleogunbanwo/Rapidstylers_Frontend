import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { requestError } from "../../hooks/remote/marketplaceApi";
import { getAuthToken, isAdminRole, showSuccessToastMessage } from "../../utils/constant";
import { AdminPage, AdminCard, AdminInput, AdminPill } from "./adminShell";
import { formatAdminTime } from "./adminFormat";

/**
 * Admin accounts (owners only): who can sign in to the admin console and with
 * which role. An owner (ADMIN) sees every screen; a manager (MANAGER) does the
 * day-to-day work only. Creating an account, changing a role or setting a new
 * password asks for the owner's own password again, the same step-up the
 * server enforces.
 */
export const ROLES = [
  ["ADMIN", "Owner", "Every admin screen, including money, settings and admin accounts."],
  ["MANAGER", "Manager", "Stylist verification, gallery and review moderation, support, feedback and viewing bookings."],
];
export const roleLabel = role => (ROLES.find(([value]) => value === role) || ROLES[0])[1];

const BLANK = { email: "", password: "", role: "ADMIN" };
const selectClass = "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";

export default function AdminAccounts() {
  const authorized = Boolean(getAuthToken() && isAdminRole());
  const [accounts, setAccounts] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(BLANK);
  const [stepUp, setStepUp] = useState("");
  const [roles, setRoles] = useState({});
  // Which account's "new password" field is open, and what has been typed in it.
  const [passwordFor, setPasswordFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  const load = async () => {
    setLoadError("");
    try {
      const data = await AdminAPI.accounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setAccounts(null);
      setLoadError(`Unable to load admin accounts. ${requestError(err)}`);
    }
  };
  useEffect(() => { if (authorized) load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Runs one change with the step-up password, then forgets the password. */
  const run = async (action, success) => {
    if (lock.current) return;
    if (!stepUp) { setError("Enter your own admin password to confirm this change."); return; }
    lock.current = true;
    setPending(true);
    setError("");
    const password = stepUp;
    setStepUp("");
    try {
      await action(password);
      showSuccessToastMessage(success);
      await load();
      return true;
    } catch (err) {
      setError(requestError(err));
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  };

  const create = async event => {
    event.preventDefault();
    const account = { email: form.email.trim(), password: form.password, role: form.role };
    if (await run(password => AdminAPI.createAccount(account, password), `${roleLabel(form.role)} account created`)) setForm(BLANK);
  };

  const changeRole = account => {
    const role = roles[account.id] || account.role;
    if (role === account.role) return;
    run(password => AdminAPI.changeAccountRole(account.id, role, password),
      `${account.email} is now ${roleLabel(role) === "Owner" ? "an owner" : "a manager"}`)
      .then(done => { if (done) setRoles(previous => ({ ...previous, [account.id]: undefined })); });
  };

  const closePassword = () => { setPasswordFor(null); setNewPassword(""); };

  const changePassword = async (event, account) => {
    event.preventDefault();
    const password = newPassword;
    // The server signs the account out everywhere, so changing your own
    // password ends this session too.
    if (await run(stepUpPassword => AdminAPI.changeAccountPassword(account.id, password, stepUpPassword),
      `New password set for ${account.email}. They are signed out everywhere.`)) closePassword();
  };

  if (!authorized) return <Navigate to="/admin/login" replace />;

  return (
    <AdminPage eyebrow="Admin" title="Admin accounts">
      <p className="mb-5 text-sm text-gray-600">
        Owners see every admin screen. Managers handle the day-to-day work: stylist verification, gallery and review
        moderation, support tickets, feedback and viewing bookings. A role change signs that person out so their next
        sign-in uses the new role. Setting a new password signs that account out everywhere, including you if it is your own.
      </p>

      <AdminCard className="mb-5">
        <label htmlFor="admin-stepup" className="block text-sm font-semibold text-gray-700">Your admin password (to confirm changes)</label>
        <AdminInput id="admin-stepup" type="password" autoComplete="current-password" value={stepUp} disabled={pending} onChange={e => setStepUp(e.target.value)} className="mt-1 max-w-sm" />
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      </AdminCard>

      <AdminCard className="mb-5">
        <h2 className="text-lg font-medium">Add an admin</h2>
        <form onSubmit={create} className="mt-4 grid gap-3 md:grid-cols-3 md:items-end">
          <label className="grid gap-1 text-sm text-gray-700">Email
            <AdminInput type="email" required value={form.email} disabled={pending} onChange={e => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm text-gray-700">Password for the new account
            <AdminInput type="password" required minLength={8} autoComplete="new-password" value={form.password} disabled={pending} onChange={e => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="grid gap-1 text-sm text-gray-700">Role
            <select value={form.role} disabled={pending} onChange={e => setForm({ ...form, role: e.target.value })} className={selectClass}>
              {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <p className="text-xs text-gray-500 md:col-span-3">{ROLES.find(([value]) => value === form.role)[2]}</p>
          <div className="md:col-span-3">
            <button type="submit" disabled={pending} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Create account"}</button>
          </div>
        </form>
      </AdminCard>

      <AdminCard pad="p-0">
        {loadError ? (
          <div role="alert" className="p-4 text-sm">{loadError} <button type="button" onClick={load} className="underline">Retry</button></div>
        ) : !accounts ? (
          <p className="p-4 text-sm text-gray-500">Loading admin accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No admin accounts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs text-gray-500">
                <tr><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3">Change role</th><th className="p-3">Password</th></tr>
              </thead>
              <tbody className="divide-y">
                {accounts.map(account => {
                  const chosen = roles[account.id] || account.role;
                  return (
                    <tr key={account.id}>
                      <td className="p-3 break-all">{account.email}</td>
                      <td className="p-3"><AdminPill tone={account.role === "MANAGER" ? "neutral" : "positive"}>{roleLabel(account.role)}</AdminPill></td>
                      <td className="p-3">{account.enabled ? "Enabled" : "Disabled"}</td>
                      <td className="p-3">{formatAdminTime(account.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select aria-label={`Role for ${account.email}`} value={chosen} disabled={pending} onChange={e => setRoles({ ...roles, [account.id]: e.target.value })} className={selectClass}>
                            {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                          <button type="button" aria-label={`Save role for ${account.email}`} disabled={pending || chosen === account.role} onClick={() => changeRole(account)} className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-50">Save</button>
                        </div>
                      </td>
                      <td className="p-3">
                        {passwordFor === account.id ? (
                          <form onSubmit={event => changePassword(event, account)} className="flex flex-wrap items-center gap-2">
                            <AdminInput type="password" required minLength={8} autoComplete="new-password" aria-label={`New password for ${account.email}`}
                              value={newPassword} disabled={pending} onChange={e => setNewPassword(e.target.value)} className="max-w-[12rem]" />
                            <button type="submit" disabled={pending || newPassword.length < 8} className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Set password</button>
                            <button type="button" disabled={pending} onClick={closePassword} className="rounded-md border px-3 py-2 text-xs font-semibold">Cancel</button>
                          </form>
                        ) : (
                          <button type="button" aria-label={`Change password for ${account.email}`} disabled={pending}
                            onClick={() => { setPasswordFor(account.id); setNewPassword(""); }} className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-50">Change password</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
