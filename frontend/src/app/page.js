'use client'

import { statuts } from '@/utils/statuts';
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Root() {

   const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const data = await statuts();

      if (data?.status) {
        router.push('/Home');
      } else if (!data?.login || data?.error) {
        router.push('/login');
      }
    }

    checkStatus()
  }, [])

  return null
}