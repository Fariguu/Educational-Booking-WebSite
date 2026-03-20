import PublicNavbar from '@/components/public-navbar'
import UpdatePasswordForm from '@/components/update-password-form'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <UpdatePasswordForm />
      </main>
    </div>
  )
}
