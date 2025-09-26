import React, { useState, useEffect } from 'react'
import { Shield, Zap, Globe, Users, ArrowRight, CheckCircle, Star, TrendingUp } from "lucide-react"
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function DAGShieldLanding() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-ping delay-2000"></div>
        
        {/* Floating Particles */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+Cjwvc3ZnPgo=')] opacity-30"></div>
        
        {/* Mouse Following Glow */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: mousePos.x - 192,
            top: mousePos.y - 192,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
              <div className="relative">
                <Shield className="h-10 w-10 text-blue-400 animate-pulse" />
                <div className="absolute inset-0 h-10 w-10 text-blue-400 animate-ping opacity-20">
                  <Shield className="h-10 w-10" />
                </div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">DAGShield</span>
              <div className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-sm">
                <span className="text-blue-300 text-sm font-semibold">Beta</span>
              </div>
            </div>
            <button className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge */}
          <div className={`inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-sm mb-8 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
            <Star className="w-5 h-5 text-yellow-400 animate-spin" />
            <span className="text-blue-300 font-semibold">Decentralized AI Security Network</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          
          {/* Main Heading */}
          <h1 className={`text-6xl md:text-8xl font-bold mb-8 leading-tight transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent animate-pulse">
              Protect Web3 with
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              AI-Powered Security
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            Join the first decentralized network that uses AI to detect threats in real-time.
            <span className="text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text font-semibold"> Earn rewards</span> while securing the future of Web3.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <button className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-bold text-xl text-white transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative flex items-center">
                Connect Wallet to Start
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>
            
            <button className="px-10 py-5 border-2 border-blue-500/50 hover:border-blue-400 rounded-2xl font-bold text-xl text-white backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-300 hover:scale-105">
              Learn More
            </button>
          </div>

          {/* Animated Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 transform transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            {[
              { value: "1,247", label: "Threats Detected", icon: Shield },
              { value: "96.1%", label: "Success Rate", icon: TrendingUp },
              { value: "2,847", label: "Active Nodes", icon: Globe },
              { value: "$12.8M", label: "Protected Value", icon: Star }
            ].map((stat, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-500 hover:scale-105">
                <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 group-hover:text-blue-300 transition-all duration-300" />
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div className={`grid md:grid-cols-3 gap-8 mb-20 transform transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            {[
              {
                icon: Zap,
                title: "Real-time Detection",
                desc: "AI-powered threat detection with sub-second response times across all major blockchains.",
                gradient: "from-yellow-400 to-orange-500"
              },
              {
                icon: Globe,
                title: "Decentralized Network",
                desc: "Distributed infrastructure ensures no single point of failure and maximum security coverage.",
                gradient: "from-green-400 to-blue-500"
              },
              {
                icon: Users,
                title: "Earn Rewards",
                desc: "Contribute to network security and earn DAG tokens for running nodes and detecting threats.",
                gradient: "from-purple-400 to-pink-500"
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                <div className="relative mb-6">
                  <feature.icon className={`h-16 w-16 mx-auto bg-gradient-to-r ${feature.gradient} p-3 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`} />
                  <div className={`absolute inset-0 h-16 w-16 mx-auto bg-gradient-to-r ${feature.gradient} p-3 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`}></div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 group-hover:bg-clip-text transition-all duration-500">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className={`bg-gradient-to-r from-white/5 via-blue-500/5 to-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 mb-20 transform transition-all duration-1000 delay-1500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-12 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Why Choose DAGShield?
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              {[
                { title: "Advanced AI Models", desc: "State-of-the-art machine learning for threat detection" },
                { title: "Multi-Chain Support", desc: "Ethereum, Polygon, Arbitrum, and more" },
                { title: "Passive Income", desc: "Earn rewards 24/7 by securing the network" },
                { title: "Community Driven", desc: "Governed by token holders and contributors" }
              ].map((benefit, index) => (
                <div key={index} className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300">
                  <CheckCircle className="h-7 w-7 text-green-400 mt-1 flex-shrink-0 group-hover:scale-110 group-hover:text-green-300 transition-all duration-300" />
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-white group-hover:text-blue-300 transition-colors duration-300">{benefit.title}</h4>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className={`text-center transform transition-all duration-1000 delay-1700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
              Ready to Secure Web3?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Connect your wallet and join thousands of security contributors earning rewards while protecting the decentralized future.
            </p>
            <button className="group px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-bold text-2xl text-white transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative">Connect Wallet Now</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-xl py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">&copy; 2024 DAGShield. Securing the decentralized future.</p>
        </div>
      </footer>

    </div>
  )
}