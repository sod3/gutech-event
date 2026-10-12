import { Login } from "@/components/login";
import { Header, Footer } from "@/components/ui";
import { currentUser } from "@/lib/security";
import { publicEvent } from "@/lib/event";
import { redirect } from "next/navigation";
export const metadata={title:"Sign in",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{role?:string}>}) { const user=await currentUser();if(user)redirect(user.role==="admin"?"/admin":user.role==="judge"?"/judge":"/dashboard");const event=await publicEvent();return <><Header/><main id="top"><Login organizer={(await searchParams).role==="admin"} supportEmail={event.supportEmail}/></main><Footer/></>; }
