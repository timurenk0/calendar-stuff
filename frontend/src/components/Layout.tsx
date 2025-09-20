import { type ReactNode } from 'react'
import Header from './Header';

const Layout = ({ children }: {children: ReactNode}) => {
  return (
    <div className='flex h-screen overflow-hidden'>
        <main className='flex-1 overflow-x-hidden overflow-y-auto'>
            <Header />
            <div className="p-3">
              {children}
            </div>
        </main>
    </div>
  )
}

export default Layout;