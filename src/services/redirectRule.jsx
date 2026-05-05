import { getUser } from "../lib/axios/getUser";
import { redirect } from "@/lib/router";

export default async function RedirectRule() {
    const user = await getUser();

    if(user) {
        redirect("dashboard");
    }

    redirect("/login");
};