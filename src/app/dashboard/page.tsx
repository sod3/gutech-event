import { redirect } from "next/navigation";
import { Participant } from "@/components/participant";
import { collections } from "@/lib/db";
import { publicEvent, safeTeam } from "@/lib/event";
import { currentUser } from "@/lib/security";
export const metadata={title:"Team dashboard",robots:{index:false,follow:false}};
export default async function Page(){const user=await currentUser();if(!user)redirect("/login");if(user.role!=="participant")redirect(user.role==="admin"?"/admin":"/judge");const team=await(await collections()).teams.findOne({_id:user.teamId,leaderId:user._id});if(!team)redirect("/login");return <Participant initialTeam={safeTeam(team,true)} event={await publicEvent()}/>;}
