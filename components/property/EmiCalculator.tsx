"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const MAX_LOAN = 1_000_000_000; // ₹100 Cr
const MAX_RATE = 30; // %
const MAX_TENURE = 40; // years

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function EmiCalculator({ propertyPrice }: { propertyPrice: number }) {
  const initialLoan = Math.max(
    0,
    Math.min(MAX_LOAN, Math.round(propertyPrice * 0.8))
  );

  const [loanAmount, setLoanAmount] = useState<number>(initialLoan);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [emi, setEmi] = useState<number>(0);

  useEffect(() => {
    const P = clamp(loanAmount, 0, MAX_LOAN);
    const R = clamp(interestRate, 0, MAX_RATE) / 12 / 100;
    const N = clamp(tenureYears, 1, MAX_TENURE) * 12;

    if (P > 0 && R > 0 && N > 0) {
      const value = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      setEmi(Math.round(value));
    } else if (P > 0 && R === 0 && N > 0) {
      setEmi(Math.round(P / N));
    } else {
      setEmi(0);
    }
  }, [loanAmount, interestRate, tenureYears]);

  const formatIndianCurrency = (num: number) => {
    if (!Number.isFinite(num) || num <= 0) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-gold-600" />
          <h3 className="font-display font-bold text-base md:text-lg text-navy-900">
            EMI Calculator
          </h3>
        </div>

        <div className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <Label htmlFor="loanAmount" className="text-xs text-navy-700">
              Loan Amount (₹)
            </Label>
            <Input
              id="loanAmount"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_LOAN}
              value={loanAmount}
              onChange={(e) =>
                setLoanAmount(clamp(Number(e.target.value), 0, MAX_LOAN))
              }
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interestRate" className="text-xs text-navy-700">
                Interest Rate (%)
              </Label>
              <Input
                id="interestRate"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0}
                max={MAX_RATE}
                value={interestRate}
                onChange={(e) =>
                  setInterestRate(clamp(Number(e.target.value), 0, MAX_RATE))
                }
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenureYears" className="text-xs text-navy-700">
                Tenure (Years)
              </Label>
              <Input
                id="tenureYears"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_TENURE}
                value={tenureYears}
                onChange={(e) =>
                  setTenureYears(clamp(Number(e.target.value), 1, MAX_TENURE))
                }
                className="h-10"
              />
            </div>
          </div>

          <div className="mt-5 p-4 bg-navy-50 rounded-lg border border-navy-100 flex flex-col items-center justify-center">
            <span className="text-xs text-navy-700 font-medium mb-1">
              Estimated Monthly EMI
            </span>
            <span className="text-2xl font-bold text-navy-900">
              {formatIndianCurrency(emi)}
            </span>
          </div>

          <p className="text-[10px] text-navy-600 text-center leading-relaxed">
            Estimates only. Final rates depend on the lender and your eligibility.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
