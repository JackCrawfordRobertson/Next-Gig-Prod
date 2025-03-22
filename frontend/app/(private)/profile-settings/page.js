// src/app/privacy/profile-settings/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from "next-auth/react"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { db, doc, getDoc, updateDoc } from '@/lib/firebase'
import { initializeApp } from 'firebase/app'


import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  jobTitles: z.array(z.string()).optional(),
  jobLocations: z.array(z.string()).optional(),
  address: z.object({
    firstLine: z.string().optional(),
    secondLine: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
  }).optional(),
  marketingConsent: z.boolean().optional(),
  profileVisibility: z.string().optional(),
  notifications: z.boolean().optional(),
})

export default function ProfileSettingsPage() {
    const router = useRouter()
    const { toast } = useToast() // Use the toast hook instead of importing directly
    const [isPending, setIsPending] = useState(false)
    const [userData, setUserData] = useState(null)
    const [subscriptionData, setSubscriptionData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
  
    const { data: session, status } = useSession({
      required: true,
      onUnauthenticated() {
        router.push('/login')
      },
    })
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (status !== "authenticated") return
        
        const userId = session.user.id // or however you access the user ID in your session
        
        // Fetch user data
        const userDocRef = doc(db, "users", userId)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          setUserData(userDoc.data())
        }
        
        // Fetch subscription data
        const subscriptionDocRef = doc(db, "subscriptions", userId)
        const subscriptionDoc = await getDoc(subscriptionDocRef)
        
        if (subscriptionDoc.exists()) {
          setSubscriptionData(subscriptionDoc.data())
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [status, session, router])
  
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      jobTitles: [],
      jobLocations: [],
      address: {
        firstLine: "",
        secondLine: "",
        city: "",
        postcode: "",
      },
      marketingConsent: false,
      profileVisibility: "private",
      notifications: true,
    },
  })
  
  useEffect(() => {
    if (userData && !isLoading) {
      form.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        jobTitles: userData.jobTitles || [],
        jobLocations: userData.jobLocations || [],
        address: {
          firstLine: userData.address?.firstLine || "",
          secondLine: userData.address?.secondLine || "",
          city: userData.address?.city || "",
          postcode: userData.address?.postcode || "",
        },
        marketingConsent: userData.marketingConsent || false,
        profileVisibility: userData.profileVisibility || "private",
        notifications: userData.notifications || true,
      })
    }
  }, [userData, isLoading, form])
  
  const onSubmit = async (data) => {
    setIsPending(true)
    
    try {
      if (status !== "authenticated") {
        router.push('/login')
        return
      }
      
      const userId = session.user.id
      const userDocRef = doc(db, "users", userId)
      
      await updateDoc(userDocRef, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        jobTitles: data.jobTitles,
        jobLocations: data.jobLocations,
        address: {
          firstLine: data.address.firstLine,
          secondLine: data.address.secondLine,
          city: data.address.city,
          postcode: data.address.postcode,
        },
        marketingConsent: data.marketingConsent,
        profileVisibility: data.profileVisibility,
        notifications: data.notifications,
        updatedAt: new Date().toISOString(),
      })
      
      toast({
        title: "Profile updated",
        description: "Your profile settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPending(false)
    }
  }
  
  const handleCancelSubscription = async () => {
    setIsPending(true)
    
    try {
      if (status !== "authenticated") {
        router.push('/login')
        return
      }
      
      const userId = session.user.id
      
      // Here you would typically call your backend API to cancel the subscription
      // This is a placeholder for that logic
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      })
      
      // Update local state
      setSubscriptionData({
        ...subscriptionData,
        status: "cancelled",
      })
      
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPending(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container  px-10 py-10">
      <div className="space-y-6">
      <Card className="p-4">
        <div>
          
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information and subscription settings
          </p>
        </div>
        </Card>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={userData?.profilePicture || ""} alt={userData?.firstName} />
                      <AvatarFallback>
                        {userData?.firstName?.charAt(0)}{userData?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Picture</Button>
                  </div>
                  
                  <div className="flex-1">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel >First Name</FormLabel>
                                <FormControl className="bg-white">
                                  <Input placeholder="Enter your first name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl className="bg-white">
                                  <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl className="bg-white">
                                  <Input type="email" placeholder="name@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Professional Information</h3>
                    <p className="text-sm text-muted-foreground">Update your job information and locations</p>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="jobTitles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel  >Job Titles</FormLabel>
                            <div className="flex flex-wrap gap-2 mb-2 bg-white">
                              {field.value?.map((title, index) => (
                                <div key={index} className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm ">
                                  {title}
                                  <button
                                    type="button"
                                    className="ml-2"
                                    onClick={() => {
                                      const newJobTitles = [...field.value]
                                      newJobTitles.splice(index, 1)
                                      field.onChange(newJobTitles)
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a job title"
                                id="newJobTitle"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const value = e.target.value.trim()
                                    if (value && !field.value.includes(value)) {
                                      field.onChange([...field.value, value])
                                      e.target.value = ''
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.getElementById('newJobTitle')
                                  const value = input.value.trim()
                                  if (value && !field.value.includes(value)) {
                                    field.onChange([...field.value, value])
                                    input.value = ''
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                            <FormDescription>
                              Press Enter or click Add to add a job title
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="jobLocations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Locations</FormLabel>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {field.value?.map((location, index) => (
                                <div key={index} className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                                  {location}
                                  <button
                                    type="button"
                                    className="ml-2"
                                    onClick={() => {
                                      const newJobLocations = [...field.value]
                                      newJobLocations.splice(index, 1)
                                      field.onChange(newJobLocations)
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a job location"
                                id="newJobLocation"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const value = e.target.value.trim()
                                    if (value && !field.value.includes(value)) {
                                      field.onChange([...field.value, value])
                                      e.target.value = ''
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.getElementById('newJobLocation')
                                  const value = input.value.trim()
                                  if (value && !field.value.includes(value)) {
                                    field.onChange([...field.value, value])
                                    input.value = ''
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                            <FormDescription>
                              Press Enter or click Add to add a job location
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                          {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="address" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>
                  Update your address and location details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="address.firstLine"
                      render={({ field }) => (
                        <FormItem >
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl className="bg-white">
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.secondLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl className="bg-white">
                            <Input placeholder="Apartment, suite, etc. (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl className="bg-white">
                              <Input placeholder="London" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address.postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode</FormLabel>
                            <FormControl className="bg-white">
                              <Input placeholder="SW1A 1AA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionData ? (
                  <>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Current Plan</h3>
                        <span className={`text-sm rounded-full px-3 py-1 ${
                          subscriptionData.status === 'trial' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : subscriptionData.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscriptionData.status === 'trial' ? 'Trial' : 
                           subscriptionData.status === 'active' ? 'Active' : 
                           subscriptionData.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold capitalize">{subscriptionData.plan} Plan</p>
                      <p className="text-muted-foreground">
                        {subscriptionData.currency === 'GBP' ? '£' : 
                         subscriptionData.currency === 'USD' ? '$' : 
                         subscriptionData.currency === 'EUR' ? '€' : ''}
                        {subscriptionData.price} per month
                      </p>
                      
                      {subscriptionData.status === 'trial' && (
                        <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                          <p>Trial ends on {new Date(subscriptionData.trialEndDate).toLocaleDateString('en-GB')}</p>
                        </div>
                      )}
                      
                      <p className="text-muted-foreground text-sm mt-2">
                        Next billing date: {new Date(
                          subscriptionData.status === 'trial' 
                            ? subscriptionData.trialEndDate 
                            : new Date(subscriptionData.startDate).setMonth(
                                new Date(subscriptionData.startDate).getMonth() + 1
                              )
                        ).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Payment Method</h3>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 rounded p-1">
                          {subscriptionData.paymentMethod === 'paypal' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                              <path d="M7 11c1.5 0 3.5-1 3.5-4.5S8.33 2 6.5 2H2v12.5h2V9h.5L7 15h2l-3-4Z" />
                              <path d="M22 8c0 3.5-2 4.5-3.5 4.5h-4c-1.5 0-2.5-1-2.5-2.5s1-2.5 2.5-2.5H19" />
                              <path d="M22 2v3" />
                              <path d="M17 15h-5.5c-1.5 0-2.5-1-2.5-2.5 0-1.5 1-2.5 2.5-2.5H17" />
                              <path d="M22 9v6" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="14" x="2" y="5" rx="2"/>
                              <line x1="2" x2="22" y1="10" y2="10"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{subscriptionData.paymentMethod}</p>
                          {subscriptionData.fingerprint && (
                            <p className="text-sm text-muted-foreground">
                              {subscriptionData.paymentMethod === 'paypal' 
                                ? `ID: ${subscriptionData.subscriptionId}`
                                : `Card ending in ${subscriptionData.fingerprint.substring(subscriptionData.fingerprint.length - 4)}`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3">
                        Update Payment Method
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="border rounded-lg p-8 text-center">
                    <h3 className="font-semibold mb-4">No Active Subscription</h3>
                    <p className="text-muted-foreground mb-6">You don't currently have an active subscription.</p>
                    <Button>Subscribe Now</Button>
                  </div>
                )}
              </CardContent>
              {subscriptionData && (
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Upgrade Plan</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Cancel Subscription</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your subscription will be cancelled immediately and you will lose access to premium features 
                          {subscriptionData.status === 'trial' 
                            ? ' at the end of your trial period.'
                            : ' at the end of your current billing period.'
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Continue Subscription</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscription}>
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="privacy" className="space-y-4 mt-4">
  <Card>
    <CardHeader>
      <CardTitle>Privacy Settings</CardTitle>
      <CardDescription>
        Manage your privacy preferences and data settings
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notifications"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Email Notifications</FormLabel>
                    <FormDescription>
                      Receive email updates about activity
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Separator />
            
            <FormField
              control={form.control}
              name="marketingConsent"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Marketing Communications</FormLabel>
                    <FormDescription>
                      Receive promotional emails and offers
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Separator />
            
            <FormField
              control={form.control}
              name="profileVisibility"
              render={({ field }) => (
                <FormItem className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
                  <div>
                    <FormLabel>Profile Visibility</FormLabel>
                    <FormDescription>
                      Control who can see your profile information
                    </FormDescription>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="contacts">Contacts Only</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Data Management</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Request Data Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-destructive">
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </CardContent>
  </Card>
</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}