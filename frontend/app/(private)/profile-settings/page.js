// src/app/privacy/profile-settings/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs, // CHANGED: for querying subscription doc by userId
} from "@/lib/firebase";import { initializeApp } from "firebase/app";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showToast } from "@/lib/toast";

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  jobTitles: z.array(z.string()).optional(),
  jobLocations: z.array(z.string()).optional(),
  address: z
    .object({
      firstLine: z.string().optional(),
      secondLine: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
    })
    .optional(),
  marketingConsent: z.boolean().optional(),
  profileVisibility: z.string().optional(),
  notifications: z.boolean().optional(),
});

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast(); // Use the toast hook instead of importing directly
  const [isPending, setIsPending] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);

    // CHANGED: store subscription data + the Firestore doc ID
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [subscriptionDocId, setSubscriptionDocId] = useState(null);


  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (status !== "authenticated") return;

        const userId = session.user.id;

        // 1. Fetch user data
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }

        // 2. Fetch subscription data by querying subscription docs
        //    that match userId in the "subscriptions" collection
        const subQuery = query(
          collection(db, "subscriptions"),
          where("userId", "==", userId) // CHANGED: filter on userId field
        );
        const subQuerySnap = await getDocs(subQuery);

        if (!subQuerySnap.empty) {
          // For simplicity, assume each user only has 1 subscription doc
          const docSnap = subQuerySnap.docs[0];
          setSubscriptionDocId(docSnap.id); // CHANGED: store the actual doc ID
          setSubscriptionData(docSnap.data());
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data. Please try again.");
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [status, session, router, toast]);

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
  });

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
      });
    }
  }, [userData, isLoading, form]);

  const onSubmit = async (data) => {
    setIsPending(true);
    try {
      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      const userId = session.user.id;
      const userDocRef = doc(db, "users", userId);

      let profilePictureUrl = userData?.profilePicture || "";

      if (selectedProfilePicture) {
        const storage = getStorage();
        const storageRef = ref(storage, `users/${userId}/profilePicture`);
        await uploadBytes(storageRef, selectedProfilePicture);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

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
        profilePicture: profilePictureUrl,
        updatedAt: new Date().toISOString(),
      });

      showToast({
        title: "Changes saved",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });
      
    } finally {
      setIsPending(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      if (status !== "authenticated") {
        router.push("/login");
        return;
      }

      // CHANGED: We must have a valid subscriptionDocId to update
      if (!subscriptionDocId) {
        toast.error("No subscription doc found for this user.");
        return;
      }

      // 1. Cancel subscription on your backend
      const userId = session.user.id;
      await fetch(`/api/cancel-subscription?userId=${userId}`, {
        method: "POST",
      });

      // 2. Update the subscription doc's status in Firestore
      await updateDoc(doc(db, "subscriptions", subscriptionDocId), {
        status: "cancelled",
      });

      // 3. Update user doc in Firestore
      await updateDoc(doc(db, "users", userId), {
        subscribed: false,
        onTrial: false,
      });

      showToast({
        title: "Subscription Cancelled",
        description: "Your subscription has been successfully cancelled.",
        variant: "success",
      });
      

      // 4. Refetch data so UI refreshes
      //    (or manually set your states if you prefer)
      setSubscriptionData((prev) => ({ ...prev, status: "cancelled" }));
      setUserData((prev) => ({
        ...prev,
        subscribed: false,
        onTrial: false,
      }));
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    }
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file && file.size <= 1024 * 1024) {
      setSelectedProfilePicture(file);
  
      // Show preview before upload
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserData((prev) => ({
          ...prev,
          profilePicture: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Error",
        description: "Please select an image file less than 1 MB.",
        variant: "destructive",
      });
    }
  };

  

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full p-4 sm:p-4 md:p-8 overflow-hidden">
      <div className="space-y-6 flex-1 flex flex-col">
        <Card className="p-4">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile information and subscription settings
            </p>
          </div>
        </Card>

        <Tabs defaultValue="general" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4 flex-1">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={userData?.profilePicture || ""}
                        alt={userData?.firstName}
                      />
                      <AvatarFallback>
                        {userData?.firstName?.charAt(0)}
                        {userData?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {/* <label htmlFor="profilePicture" className="cursor-pointer">
                      <span className="sr-only">Change profile picture</span>
                      <input
  id="profilePicture"
  name="profilePicture"
  type="file"
  accept="image/*"
  className="hidden"
  onClick={(e) => (e.target.value = null)} 
  onChange={handleProfilePictureChange}
/>
                      <Button variant="outline" size="sm" as="span">
                        Change Picture
                      </Button>
                    </label> */}
                  </div>

                  <div className="flex-1">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl className="bg-white">
                                  <Input
                                    placeholder="Enter your first name"
                                    {...field}
                                  />
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
                                  <Input
                                    placeholder="Enter your last name"
                                    {...field}
                                  />
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
                                  <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    {...field}
                                  />
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
                    <h3 className="text-lg font-medium">
                      Professional Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Update your job information and locations
                    </p>
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="jobTitles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Titles</FormLabel>
                            <div className="flex flex-wrap gap-2 mb-2 ">
                              {field.value?.map((title, index) => (
                                <div
                                  key={index}
                                  className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm "
                                >
                                  {title}
                                  <button
                                    type="button"
                                    className="ml-2"
                                    onClick={() => {
                                      const newJobTitles = [...field.value];
                                      newJobTitles.splice(index, 1);
                                      field.onChange(newJobTitles);
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
                                className="bg-white"
                                id="newJobTitle"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const value = e.target.value.trim();
                                    if (value && !field.value.includes(value)) {
                                      field.onChange([...field.value, value]);
                                      e.target.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input =
                                    document.getElementById("newJobTitle");
                                  const value = input.value.trim();
                                  if (value && !field.value.includes(value)) {
                                    field.onChange([...field.value, value]);
                                    input.value = "";
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
                                <div
                                  key={index}
                                  className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm"
                                >
                                  {location}
                                  <button
                                    type="button"
                                    className="ml-2"
                                    onClick={() => {
                                      const newJobLocations = [...field.value];
                                      newJobLocations.splice(index, 1);
                                      field.onChange(newJobLocations);
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                className="bg-white"
                                placeholder="Add a job location"
                                id="newJobLocation"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const value = e.target.value.trim();
                                    if (value && !field.value.includes(value)) {
                                      field.onChange([...field.value, value]);
                                      e.target.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input =
                                    document.getElementById("newJobLocation");
                                  const value = input.value.trim();
                                  if (value && !field.value.includes(value)) {
                                    field.onChange([...field.value, value]);
                                    input.value = "";
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
                          {isPending ? "Saving..." : "Save Changes"}
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
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="address.firstLine"
                      render={({ field }) => (
                        <FormItem>
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
                            <Input
                              placeholder="Apartment, suite, etc. (optional)"
                              {...field}
                            />
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
                        {isPending ? "Saving..." : "Save Changes"}
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
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Current Plan</h3>
              <span
                className={`text-sm rounded-full px-3 py-1 ${
                  subscriptionData.status === "trial"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {subscriptionData.status === "trial" ? "Trial" : "Active"}
              </span>
            </div>
            <p className="text-2xl font-bold capitalize">
              {subscriptionData.plan} Plan
            </p>
            <p className="text-muted-foreground">
              {subscriptionData.currency === "GBP" ? "£" : ""}
              {subscriptionData.price} per month
            </p>

            {subscriptionData.status === "trial" && (
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span>Trial Progress</span>
                  <span>
                    {Math.ceil(
                      (new Date(subscriptionData.trialEndDate) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days left
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        ((new Date() - new Date(subscriptionData.startDate)) /
                          (new Date(subscriptionData.trialEndDate) -
                            new Date(subscriptionData.startDate))) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            <p className="text-muted-foreground text-sm mt-4">
              Subscription started on{" "}
              {new Date(subscriptionData.startDate).toLocaleDateString(
                "en-GB"
              )}
            </p>
            <p className="text-muted-foreground text-sm">
              {subscriptionData.status === "trial"
                ? `Trial ends on ${new Date(
                    subscriptionData.trialEndDate
                  ).toLocaleDateString("en-GB")}`
                : `Next billing date: ${new Date(
                    new Date(subscriptionData.startDate).setMonth(
                      new Date(subscriptionData.startDate).getMonth() + 1
                    )
                  ).toLocaleDateString("en-GB")}`}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 rounded p-1">
                {subscriptionData.paymentMethod === "paypal" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M7 11c1.5 0 3.5-1 3.5-4.5S8.33 2 6.5 2H2v12.5h2V9h.5L7 15h2l-3-4Z" />
                    <path d="M22 8c0 3.5-2 4.5-3.5 4.5h-4c-1.5 0-2.5-1-2.5-2.5s1-2.5 2.5-2.5H19" />
                    <path d="M22 2v3" />
                    <path d="M17 15h-5.5c-1.5 0-2.5-1-2.5-2.5 0-1.5 1-2.5 2.5-2.5H17" />
                    <path d="M22 9v6" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium capitalize">
                  {subscriptionData.paymentMethod}
                </p>
                {subscriptionData.fingerprint && (
                  <p className="text-sm text-muted-foreground">
                    {subscriptionData.paymentMethod === "paypal"
                      ? `ID: ${subscriptionData.subscriptionId}`
                      : `Card ending in ${subscriptionData.fingerprint.substring(
                          subscriptionData.fingerprint.length - 4
                        )}`}
                  </p>
                )}
              </div>
            </div>
            
          </div>
        </>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <h3 className="font-semibold mb-4">No Active Subscription</h3>
          <p className="text-muted-foreground mb-6">
            You don't currently have an active subscription.
          </p>
          <Button>Subscribe Now</Button>
        </div>
      )}
    </CardContent>
    {subscriptionData && (
      <CardFooter className="flex justify-between">
        <Button variant="destructive" onClick={handleCancelSubscription}>
          Cancel Subscription
        </Button>
      </CardFooter>
    )}
  </Card>
</TabsContent>
          <TabsContent value="privacy" className="space-y-4 mt-4 flex-1">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Manage your privacy preferences and data settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <Separator />

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

                      <div>
                        <h3 className="font-medium mb-2">Data Management</h3>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              showToast({
                                title: "Data Export Requested",
                                description:
                                  "Your data export has been queued. You'll receive an email when it's ready.",
                                variant: "success",
                              });
                            }}
                          >
                            Request Data Export
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-destructive"
                              >
                                Delete Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete your account and remove
                                  your data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => {
                                    showToast({
                                      title: "Account Deletion Initiated",
                                      description:
                                        "Your account deletion process has begun. You'll receive a confirmation email.",
                                      variant: "error",
                                    });
                                  }}
                                >
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
                        {isPending ? "Saving..." : "Save Privacy Settings"}
                      </Button>
                    </div>
                    <ToastContainer />
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
