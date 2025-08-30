"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconPhone,
  IconClock,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  // Form states
  const [step, setStep] = useState<"phone" | "otp" | "verified">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.split("").slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);

      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit input
      if (/^\d*$/.test(value)) {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    }
  };

  // Handle key down for backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Handle send OTP
  // Handle send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      // Move to OTP step
      setStep("otp");
      setTimer(60);
      setIsResendDisabled(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // Sign in with NextAuth using phone and OTP
      const result = await signIn("phone-otp", {
        phone: phoneNumber,
        otp: otpValue,
        redirect: false,
      });
      debugger;

      if (result?.error) {
        setError("Invalid OTP. Please try again.");
      } else {
        // Redirect to dashboard
        setStep("verified");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setTimer(60);
      setIsResendDisabled(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleBackToPhone = () => {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg bg-white">
            <Image
              src="/icon.png"
              alt="EasyLearning Logo"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            EasyLearning
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {step === "phone"
              ? "Sign in to your account"
              : step === "otp"
              ? "Verify your phone number"
              : "Verification Successful!"}
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          {step === "verified" ? (
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <IconCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Successfully Verified!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Redirecting you to the dashboard...
                </p>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
                </div>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">
                  {step === "phone" ? "Welcome Back" : "Enter Verification Code"}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {step === "phone"
                    ? "Enter your phone number to receive a verification code"
                    : `We've sent a 6-digit code to ${phoneNumber}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === "phone" && (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IconPhone className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Please Enter Your Phone Number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <>
                          Send Verification Code
                          <IconArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* OTP Verification Form */}
                {step === "otp" && (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
                        />
                      ))}
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Phone number display with change option */}
                    <div className="flex items-center justify-center gap-2">
                      <IconPhone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {phoneNumber}
                      </span>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={handleBackToPhone}
                      >
                        Change
                      </Button>
                    </div>

                    {/* Resend OTP */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Didn&apos;t receive the code?{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto font-medium text-blue-600 dark:text-blue-400"
                          onClick={handleResend}
                          disabled={isResendDisabled}
                        >
                          {isResendDisabled ? (
                            <span className="flex items-center gap-1">
                              <IconClock className="h-3 w-3" />
                              Resend in {timer}s
                            </span>
                          ) : (
                            "Resend"
                          )}
                        </Button>
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
                      disabled={isLoading || otp.join("").length !== 6}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Verifying...
                        </div>
                      ) : (
                        <>
                          Verify & Sign In
                          <IconCheck className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Alternative Login Methods */}
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            By continuing, you agree to EasyLearning&apos;s{" "}
            <Link
              href="/terms"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
