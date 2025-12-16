"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Copy, RefreshCw, Info } from "lucide-react"
import { GSTCalculationResult } from "@/lib/gst-service"

interface GSTCalculatorProps {
  onResult?: (result: GSTCalculationResult) => void
}

export function GSTCalculator({ onResult }: GSTCalculatorProps) {
  const [amount, setAmount] = useState("")
  const [gstRate, setGstRate] = useState("18")
  const [state, setState] = useState("MAHARASHTRA")
  const [isInterState, setIsInterState] = useState(false)
  const [isExport, setIsExport] = useState(false)
  const [isExempt, setIsExempt] = useState(false)
  const [result, setResult] = useState<GSTCalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const states = [
    "ANDAMAN & NICOBAR ISLANDS", "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM",
    "BIHAR", "CHANDIGARH", "CHHATTISGARH", "DADRA & NAGAR HAVELI", "DAMAN & DIU",
    "DELHI", "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JAMMU & KASHMIR",
    "JHARKHAND", "KARNATAKA", "KERALA", "LAKSHADWEEP", "MADHYA PRADESH",
    "MAHARASHTRA", "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA",
    "PUDUCHERRY", "PUNJAB", "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA",
    "TRIPURA", "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL"
  ]

  const serviceRates = [
    { name: "Subscription Services", rate: 18 },
    { name: "Premium Features", rate: 18 },
    { name: "Trading Fees", rate: 18 },
    { name: "GST Payment", rate: 0 },
    { name: "Custom Rate", rate: 0 }
  ]

  const calculateGST = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gst/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          gstRate: gstRate === "custom" ? parseFloat(gstRate) : parseFloat(gstRate),
          state,
          isInterState,
          isExport,
          isExempt
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to calculate GST")
      }

      const data = await response.json()
      setResult(data.data)
      onResult?.(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR"
    }).format(amount)
  }

  const getGSTRateDisplay = () => {
    if (isExport || isExempt) return "0% (Exempt/Export)"
    if (gstRate === "custom") return `${gstRate}% (Custom)`
    return `${gstRate}%`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            GST Calculator
          </CardTitle>
          <CardDescription>
            Calculate GST for your transactions with accurate tax breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="gstRate">GST Rate</Label>
              <Select value={gstRate} onValueChange={setGstRate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GST rate" />
                </SelectTrigger>
                <SelectContent>
                  {serviceRates.map((service) => (
                    <SelectItem key={service.name} value={service.rate.toString()}>
                      {service.name} ({service.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {gstRate === "0" && (
              <div>
                <Label htmlFor="customRate">Custom GST Rate (%)</Label>
                <Input
                  id="customRate"
                  type="number"
                  placeholder="Enter custom rate"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            )}

            <div>
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((stateName) => (
                    <SelectItem key={stateName} value={stateName}>
                      {stateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="interState">Inter-state Supply</Label>
              <Switch
                id="interState"
                checked={isInterState}
                onCheckedChange={setIsInterState}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="export">Export/Outside India</Label>
              <Switch
                id="export"
                checked={isExport}
                onCheckedChange={setIsExport}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="exempt">GST Exempt</Label>
              <Switch
                id="exempt"
                checked={isExempt}
                onCheckedChange={setIsExempt}
              />
            </div>
          </div>

          <Button 
            onClick={calculateGST} 
            disabled={loading || !amount}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate GST
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              GST Calculation Result
              <Badge variant="outline">{getGSTRateDisplay()}</Badge>
            </CardTitle>
            <CardDescription>
              Tax breakdown for {formatCurrency(result.baseAmount)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Base Amount:</span>
                    <span className="font-medium">{formatCurrency(result.baseAmount)}</span>
                  </div>
                  
                  {result.cgstAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CGST ({result.gstRate / 2}%):</span>
                      <span className="font-medium">{formatCurrency(result.cgstAmount)}</span>
                    </div>
                  )}
                  
                  {result.sgstAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">SGST ({result.gstRate / 2}%):</span>
                      <span className="font-medium">{formatCurrency(result.sgstAmount)}</span>
                    </div>
                  )}
                  
                  {result.igstAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">IGST ({result.gstRate}%):</span>
                      <span className="font-medium">{formatCurrency(result.igstAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">Total GST:</span>
                    <span className="font-medium">{formatCurrency(result.totalGST)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold">Total Amount:</span>
                    <span className="text-base font-bold">{formatCurrency(result.totalAmount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Supply Type:</strong> {result.isInterState ? "Inter-state" : "Intra-state"}</p>
                    <p><strong>State:</strong> {result.state}</p>
                    <p><strong>GST Applicable:</strong> {result.gstRate > 0 ? "Yes" : "No"}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.baseAmount.toString())}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Base
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.totalGST.toString())}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      GST
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.totalAmount.toString())}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Total
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}