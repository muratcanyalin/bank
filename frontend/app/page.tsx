import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-800">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-6xl font-bold mb-8 text-primary-600 dark:text-primary-400">
          🏦 Mini Banking Platform
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
          Fintech Learning Project - Modern Banking UI
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="btn-primary text-lg px-8 py-3"
          >
            Dashboard'a Git
          </Link>
          <Link
            href="/accounts"
            className="btn-secondary text-lg px-8 py-3"
          >
            Hesaplar
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Hesaplar
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tüm hesaplarınızı görüntüleyin
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">💸</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Para Transferi
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Hızlı ve güvenli transfer
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">📜</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              İşlem Geçmişi
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Detaylı işlem kayıtları
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
