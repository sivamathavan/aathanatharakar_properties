"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

export function EmiCalculator({ propertyPrice }: { propertyPrice: number }) {
  const [loanAmount, setLoanAmount] = useState<number>(propertyPrice * 0.8);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [emi, setEmi] = useState<number>(0);

  useEffect(() => {
    calculateEmi();
  }, [loanAmount, interestRate, tenureYears]);

  const calculateEmi = () => {
    const P = loanAmount;
    const R = interestRate / 12 / 100;
    const N = tenureYears * 12;

    if (P > 0 && R > 0 && N > 0) {
      const emiValue = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      setEmi(Math.round(emiValue));
    } else {
      setEmi(0);
    }
  };

  const formatIndianCurrency = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm mt-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-gold-600" />
          <h3 className="font-display font-bold text-lg text-navy-900">EMI Calculator</h3>
        </div>
        
        <div className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <Label htmlFor="loanAmount" className="text-xs text-navy-700">Loan Amount (₹)</Label>
            <Input 
              id="loanAmount"
              type="number" 
              value={loanAmount} 
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="h-10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interestRate" className="text-xs text-navy-700">Interest Rate (%)</Label>
              <Input 
                id="interestRate"
                type="number" 
                step="0.1"
                value={interestRate} 
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenureYears" className="text-xs text-navy-700">Tenure (Years)</Label>
              <Input 
                id="tenureYears"
                type="number" 
                value={tenureYears} 
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="h-10"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-navy-50 rounded-lg border border-navy-100 flex flex-col items-center justify-center">
            <span className="text-xs text-navy-700 font-medium mb-1">Estimated Monthly EMI</span>
            <span className="text-2xl font-bold text-navy-900">{formatIndianCurrency(emi)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
