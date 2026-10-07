'use client'
import { ClientFooter } from '@/componnents/layouts/footer/ClientFooter'
import { ClientHeader } from '@/componnents/layouts/header/ClientHeader'
import React from 'react'

export default function ClientMainContainerPage({children,activeHeader}) {
  return (
    <>
    <ClientHeader activeHeader={activeHeader} />
        <main id="main" role="main" className="p-0 m-0">
            {children}
        </main>
    <ClientFooter />
    </>
  )
}
