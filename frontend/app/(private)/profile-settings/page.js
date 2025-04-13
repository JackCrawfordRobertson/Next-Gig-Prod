// frontend/app/(private)/profile-settings/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "@/lib/firebase";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showToast } from "@/lib/toast";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { isDevelopmentMode } from "@/lib/environment";

// Import directly from subscriptionService to avoid conflicts
import * as subscriptionService from "@/lib/subscription";

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

// Define the ExistingSubscriptionsModal outside any other functions
// so it has proper scope
const ExistingSubscriptionsModal = ({ existingSubscriptions, onClose }) => {
  if (!existingSubscriptions) return null;

  return (
    <AlertDialog open={!!existingSubscriptions} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Existing Subscription Detected</AlertDialogTitle>
          <AlertDialogDescription>
            You already have the following subscription(s):
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          {existingSubscriptions.map((sub, index) => (
            <div key={index} className="border p-2 rounded">
              <p>Plan: {sub.plan}</p>
              <p>Status: {sub.status}</p>
              <p>Started: {new Date(sub.startDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [existingSubscriptions, setExistingSubscriptions] = useState(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "general");
  const [error, setError] = useState(null);

  // CHANGED: store subscription data + the Firestore doc ID
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionDocId, setSubscriptionDocId] = useState(null);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  const fetchUserData = async () => {
    try {
      if (status !== "authenticated") {
        console.log("Auth status not ready:", status);
        if (status === "unauthenticated") {
          setIsLoading(false);
        }
        return;
      }

      const userId = session?.user?.id;
      if (!userId) {
        console.error("Missing user ID in session:", session);
        setError("Session information is missing");
        setIsLoading(false);
        return;
      }

      console.log("Fetching user data with ID:", userId);

      // First get basic user data directly
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const basicUserData = userSnap.data();
          console.log("Basic user data retrieved");
          setUserData(basicUserData);
        } else {
          console.warn("User document not found");
          setError("User profile not found");
        }
      } catch (userError) {
        console.error("Error fetching user document:", userError);
        setError("Failed to load basic profile data");
      }

      // Get subscription data
      try {
        console.log("Fetching subscription status");
        const result = await subscriptionService.getUserSubscriptionStatus(
          userId
        );
        console.log("Subscription result received");

        // Use userData from result if available
        if (result.userData) {
          setUserData((prev) => ({ ...prev, ...result.userData }));
        }

        // Set subscription data
        if (result.subscriptionData) {
          setSubscriptionData(result.subscriptionData);
        } else if (result.hasSubscription !== undefined) {
          // Create minimal subscription data object
          setSubscriptionData({
            status: result.isOnTrial
              ? "trial"
              : result.hasSubscription
              ? "active"
              : "inactive",
            plan: "standard",
            onTrial: !!result.isOnTrial,
          });
        }

        if (result.subscriptionDocId) {
          setSubscriptionDocId(result.subscriptionDocId);
        }
      } catch (subError) {
        console.error("Error fetching subscription:", subError);
        // Don't fail the whole page - we can still show user data
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      setError("Failed to load profile data");
    } finally {
      console.log("Setting isLoading to false");
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    fetchUserData();
  }, [session, status]);

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
        title: "Profile Updated Successfully",
        description: "Your profile information has been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast({
        title: "Update Failed",
        description:
          "There was an error saving your profile. Please try again.",
        variant: "destructive",
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

      if (!subscriptionData?.subscriptionId) {
        showToast({
          title: "Cancellation Error",
          description: "No subscription ID found.",
          variant: "destructive",
        });
        return;
      }

      // Show confirmation toast
      showToast({
        title: "Cancelling Subscription...",
        description: "Please wait while we process your request.",
        variant: "info",
      });

      // Cancel subscription via the service
      const userId = session.user.id;
      const result = await subscriptionService.cancelSubscription(
        userId,
        subscriptionData.subscriptionId,
        subscriptionDocId
      );

      if (!result.success) {
        throw new Error("Subscription cancellation failed");
      }

      // Update UI state
      setSubscriptionData((prev) => ({ ...prev, status: "cancelled" }));
      setUserData((prev) => ({
        ...prev,
        subscribed: false,
        onTrial: false,
      }));

      showToast({
        title: "Subscription Cancelled",
        description: "Your subscription has been successfully cancelled.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      showToast({
        title: "Cancellation Failed",
        description:
          error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [currentPlanType, setCurrentPlanType] = useState("standard");

  const handleResubscribe = () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    // Simply open the subscription modal
    setSubscriptionModalOpen(true);
  };

  const handleSubscribe = () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    // Simply open the subscription modal
    setSubscriptionModalOpen(true);
  };

  const handleSubscriptionSuccess = async (subscriptionData) => {
    try {
      // Use the improved service function
      const result = await subscriptionService.storeSubscription(
        session.user.id,
        subscriptionData,
        userData?.deviceFingerprint || navigator.userAgent,
        { showToast: true }
      );

      // Update local state with the result
      setSubscriptionData({
        userId: session.user.id,
        subscriptionId:
          subscriptionData.subscriptionID || subscriptionData.subscriptionId,
        status: result.onTrial ? "trial" : "active",
        plan: "paypal",
        price: 2.99,
        currency: "GBP",
        paymentMethod: "paypal",
        startDate: new Date().toISOString(),
        trialEndDate: result.trialEndDate,
        onTrial: result.onTrial || false,
        trialEligibility: {
          duration: result.trialDuration || 0,
          reason: result.trialEligibilityReason || "Standard subscription",
        },
      });

      if (result.subscriptionDocId) {
        setSubscriptionDocId(result.subscriptionDocId);
      }

      // Update user data in local state
      setUserData((prev) => ({
        ...prev,
        subscribed: true,
        onTrial: result.onTrial || false,
        subscriptionPlan: "paypal",
        subscriptionId:
          subscriptionData.subscriptionID || subscriptionData.subscriptionId,
        subscriptionStartDate: new Date().toISOString(),
        trialEndDate: result.trialEndDate,
        trialEligibilityReason: result.trialEligibilityReason,
      }));
    } catch (error) {
      console.error("Error handling subscription success:", error);
      showToast({
        title: "Subscription Error",
        description:
          "There was an error activating your subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Check URL parameters for subscription status
    const queryParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = queryParams.get("subscription");

    if (subscriptionStatus === "success") {
      showToast({
        title: "Subscription Activated!",
        description: "Your subscription has been successfully activated.",
        variant: "success",
      });

      // Remove the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Refresh the subscription data
      fetchUserData();
    }
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    router.push(`/profile-settings?tab=${value}`, { scroll: false });
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      ["general", "address", "subscription", "privacy"].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  // Create safe versions of our data to prevent null reference errors
  const safeUserData = userData || {};
  const safeSubscriptionData = subscriptionData || {};
  const subscriptionStatus =
    safeSubscriptionData.status ||
    (safeUserData.subscribed
      ? "active"
      : safeUserData.onTrial
      ? "trial"
      : "inactive");

  // Use safe status for display logic
  const isSubscribed =
    subscriptionStatus === "active" ||
    subscriptionStatus === "trial" ||
    safeUserData.subscribed ||
    safeUserData.onTrial;

    function TrialProgressBar({ startDate, endDate, trialEligibility }) {
      // Add state to track current time
      const [currentTime, setCurrentTime] = useState(new Date());
      
      // Set up interval to update the time
      useEffect(() => {
        // Update every minute
        const timer = setInterval(() => {
          setCurrentTime(new Date());
        }, 60000);
        
        // Clean up the interval on unmount
        return () => clearInterval(timer);
      }, []);
      
      try {
        // Validate inputs
        if (!startDate || !endDate) {
          throw new Error("Missing required dates");
        }
        
        // Parse dates
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error("Invalid date format");
        }
        
        // Calculate days left
        const daysLeft = Math.max(
          0,
          Math.ceil((endDateTime - currentTime) / (1000 * 60 * 60 * 24))
        );
        
        // Calculate progress percentage
        const totalDuration = endDateTime - startDateTime;
        const elapsed = currentTime - startDateTime;
        const percentage = Math.min(
          100,
          Math.max(0, Math.round((elapsed / totalDuration) * 100))
        );
        
        return (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span>Trial Progress</span>
              <span>{daysLeft} days left</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            {/* Add trial eligibility details */}
            {trialEligibility && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>
                  {trialEligibility.reason ||
                    (trialEligibility.duration < 7
                      ? "Partial trial based on previous usage"
                      : "Full trial period")}
                </p>
              </div>
            )}
          </div>
        );
      } catch (e) {
        console.error("Error in trial progress calculation:", e);
        return (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span>Trial Progress</span>
              <span>Trial active</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full w-0"></div>
            </div>
          </div>
        );
      }
    }
    return (
<div className="min-h-screen w-full p-4 mb-10 sm:mb-0 sm:p-4 md:p-8 overflow-auto">
<div className="space-y-6 flex-1 flex flex-col pb-16">
          <Card className="p-4">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile information and subscription settings
              </p>
            </div>
          </Card>
    
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
                <Button
                  variant="outline"
                  onClick={fetchUserData}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
    
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full flex flex-col"
          >
          <TabsList className="grid w-full grid-cols-4 overflow-x-auto">
    <TabsTrigger value="general" className="text-xs sm:text-sm px-1 sm:px-3">General</TabsTrigger>
    <TabsTrigger value="address" className="text-xs sm:text-sm px-1 sm:px-3">Address</TabsTrigger>
    <TabsTrigger value="subscription" className="text-xs sm:text-sm px-1 sm:px-3">
      <span className="hidden sm:inline">Subscription</span>
      <span className="inline sm:hidden">Subs</span>
    </TabsTrigger>
    <TabsTrigger value="privacy" className="text-xs sm:text-sm px-1 sm:px-3">Privacy</TabsTrigger>
  </TabsList>
            <div className="mt-4 overflow-auto flex-1">
              <TabsContent value="general" className="space-y-4">
                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-auto">
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
                      </div>
    
                      <div className="flex-1">
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                        <h3 className="text-base sm:text-lg font-medium">
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
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {field.value?.map((title, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm"
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
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    placeholder="Add a job title"
                                    className="bg-white flex-1"
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
                                    className="sm:w-auto w-full"
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
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    className="bg-white flex-1"
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
                                    className="sm:w-auto w-full"
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
                            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                              {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
    
              <TabsContent value="address" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                    <CardDescription>
                      Update your address and location details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-auto">
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
    
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                            {isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
    
              <TabsContent value="subscription" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>
                      Manage your subscription plan and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 overflow-auto">
                    {isLoading ? (
                      <div className="border rounded-lg p-4 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">
                          Loading subscription information...
                        </p>
                      </div>
                    ) : error ? (
                      <div className="border rounded-lg p-6 text-center bg-red-50">
                        <h3 className="font-semibold mb-2 text-red-600">
                          Error Loading Subscription
                        </h3>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => fetchUserData()}>Try Again</Button>
                      </div>
                    ) : subscriptionData &&
                      subscriptionData.status === "cancelled" ? (
                      <div className="border rounded-lg p-4 sm:p-8 text-center">
                        <h3 className="font-semibold mb-2 sm:mb-4">
                          Subscription Cancelled
                        </h3>
                        <p className="text-muted-foreground mb-4 sm:mb-6">
                          Your subscription has been cancelled. Reactivate to
                          continue enjoying our services.
                        </p>
                        <Button onClick={() => handleResubscribe()}>
                          Resubscribe Now
                        </Button>
                      </div>
                    ) : subscriptionData ? (
                      <>
                        <div className="border rounded-lg p-4 bg-white">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                            <h3 className="font-semibold mb-1 sm:mb-0">Current Plan</h3>
                            <span
                              className={`text-sm rounded-full px-3 py-1 w-fit ${
                                subscriptionData.status === "trial"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {subscriptionData.status === "trial"
                                ? "Trial"
                                : "Active"}
                            </span>
                          </div>
                          <p className="text-2xl font-bold capitalize">
                            {subscriptionData.plan} Plan
                          </p>
                          <p className="text-muted-foreground">
                            {subscriptionData.currency === "GBP" ? "£" : ""}
                            {subscriptionData.price} per month
                          </p>
    
                          {subscriptionData.status === "trial" &&
                            subscriptionData.trialEndDate && (
                              <TrialProgressBar 
                                startDate={subscriptionData.startDate} 
                                endDate={subscriptionData.trialEndDate}
                                trialEligibility={subscriptionData.trialEligibility}
                              />
                            )}
    
                          <p className="text-muted-foreground text-sm mt-4">
                            Subscription started on{" "}
                            {(() => {
                              try {
                                return new Date(
                                  subscriptionData.startDate
                                ).toLocaleDateString("en-GB");
                              } catch (e) {
                                return "N/A";
                              }
                            })()}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {subscriptionData.status === "trial" &&
                            subscriptionData.trialEndDate
                              ? `Trial ends on ${new Date(
                                  subscriptionData.trialEndDate
                                ).toLocaleDateString("en-GB")}`
                              : `Next billing date: ${(() => {
                                  try {
                                    const nextBillingDate = new Date(
                                      subscriptionData.startDate
                                    );
                                    nextBillingDate.setMonth(
                                      nextBillingDate.getMonth() + 1
                                    );
                                    return nextBillingDate.toLocaleDateString(
                                      "en-GB"
                                    );
                                  } catch (e) {
                                    return "N/A";
                                  }
                                })()}`}
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
                                {subscriptionData.paymentMethod || "PayPal"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {subscriptionData.subscriptionId
                                  ? `ID: ${subscriptionData.subscriptionId.substring(
                                      0,
                                      8
                                    )}...`
                                  : "Subscription ID not available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="border rounded-lg p-4 sm:p-8 text-center">
                        <h3 className="font-semibold mb-2 sm:mb-4">
                          No Active Subscription
                        </h3>
                        <p className="text-muted-foreground mb-4 sm:mb-6">
                          You don't currently have an active subscription.
                        </p>
                        <Button onClick={handleSubscribe}>Subscribe Now</Button>
                      </div>
                    )}
                  </CardContent>
    
                  {subscriptionData && subscriptionData.status !== "cancelled" && (
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        className="w-full sm:w-auto"
                      >
                        Cancel Subscription
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
    
              <TabsContent value="privacy" className="space-y-4">
                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Manage your privacy preferences and data settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 overflow-auto">
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
                                  <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground w-full sm:w-auto"
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
                          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                            {isPending ? "Saving..." : "Save Privacy Settings"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
          <SubscriptionModal
            isOpen={subscriptionModalOpen}
            onClose={() => setSubscriptionModalOpen(false)}
            userId={session?.user?.id}
            onSuccess={handleSubscriptionSuccess}
          />
          {/* Render the ExistingSubscriptionsModal with the needed props */}
          <ExistingSubscriptionsModal
            existingSubscriptions={existingSubscriptions}
            onClose={() => setExistingSubscriptions(null)}
          />
        </div>
      </div>
    );
  }