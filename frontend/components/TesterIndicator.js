// components/TesterIndicator.js
import React from 'react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isUserTester } from '@/lib/subscription';
import { Card, CardContent } from '@/components/ui/card';

export function TesterIndicator() {
  const { data: session } = useSession();
  const [isTester, setIsTester] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkTesterStatus() {
      if (session?.user?.email) {
        const testerStatus = await isUserTester(session.user.email);
        setIsTester(testerStatus);
      }
      setLoading(false);
    }
    
    checkTesterStatus();
  }, [session]);
  
  if (loading || !isTester) return null;
  
  return (
    React.createElement(Card, {
      className: "bg-blue-50 border-blue-200 shadow-sm mb-4"
    }, 
      React.createElement(CardContent, {
        className: "p-4"
      }, [
        React.createElement("h3", {
          className: "font-medium text-blue-800",
          key: "title"
        }, "Tester Account"),
        React.createElement("p", {
          className: "text-blue-700 text-sm",
          key: "description"
        }, "You have unlimited access as a tester. Thank you for helping improve Next Gig!")
      ])
    )
  );
}