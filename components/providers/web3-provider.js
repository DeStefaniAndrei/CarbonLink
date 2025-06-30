"use client"

import { createContext, useContext, useState, useEffect } from "react"

const Web3Context = createContext(undefined)

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const isConnected = !!account

  const connect = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to use this application")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      setAccount(accounts[0])
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null)
      })
    }
  }, [])

  return (
    <Web3Context.Provider value={{ account, isConnected, isConnecting, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
} 