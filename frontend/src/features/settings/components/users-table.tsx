/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable import/order */
"use client";

import React from "react";

import { Icon } from "@radix-ui/react-select";
import { ChevronDown, Delete, UserCog } from "lucide-react";

import { type UserWithRole } from "~/actions/project-actions";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableHeader,
	TableHead,
	TableRow,
	TableCell,
} from "~/components/ui/table";
import UserProfilePicture from "~/components/UserProfilePicture";
import {
	editUserRole,
	removeUserFromProject,
} from "~/features/settings/actions/settings-actions";
import { cn } from "~/lib/utils";
import { userRoles } from "~/schema";
import { Form, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addSkills } from "~/actions/project-actions";


function UsersTable({
	users,
	projectId,
	userId,
}: {
	users: UserWithRole[];
	projectId: number;
	userId: string;
}) {
	const formSchema = z.object({
	description: z.string().max(1000),
	});


	const form = useForm<z.infer<typeof formSchema>>({
			resolver: zodResolver(formSchema),
			defaultValues: {
				description: "",
			},
	});
	async function onSubmit(values: z.infer<typeof formSchema>) {
		const response = await addSkills(projectId,userId,values.description);
	}
	return (
		<div className="overflow-hidden rounded-lg border bg-background-dialog/50 py-2">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="font-bold text-primary">
							Member
						</TableHead>
						<TableHead className="font-bold text-primary">
							Role
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map(
						(user) =>
							user !== null && (
								<TableRow key={user.user_id}>
									<TableCell className="px-4 py-1">
										<div className="flex items-center gap-4">
											<UserProfilePicture
												src={user.profilePicture}
												size={25}
											/>
											<span className="font-bold">
												{user.username}
											</span>
										</div>
									</TableCell>
									<TableCell
										className={cn("px-4 py-1", {
											"pointer-events-none opacity-50":
												user.user_role === "owner" ||
												user.user_id === userId,
										})}
									>
										<Select
											value={user.user_role}
											onValueChange={(val) =>
												editUserRole(
													user.user_id,
													projectId,
													val,
												)
											}
										>
											<SelectTrigger className="w-[180px] border-none bg-transparent p-0 capitalize">
												<SelectValue className="capitalize" />
												<Icon asChild>
													<ChevronDown className="h-4 w-4 opacity-50" />
												</Icon>
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{userRoles.map((role) => {
														return (
															<SelectItem
																key={role}
																value={role}
																className="flex capitalize"
															>
																{role}
																<div className="flex-grow" />
															</SelectItem>
														);
													})}
												</SelectGroup>
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<Dialog>
											<DialogTrigger>
												{user.user_id == userId && (
												<Button variant="secondary"
														size="sm"
														className="hover:bg-blue-500"
												>
													<UserCog className="h-4 w-4"/>
												</Button>)}
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>
														Donner votre compétence
													</DialogTitle>
												</DialogHeader>
												<Form {...form}>
													<form onSubmit={form.handleSubmit(onSubmit)}>
														<FormField
															control={form.control}
															name="description"
															render={({ field }) => (
																<FormItem>
																	<Textarea
																		placeholder="Describe the tasks you would like to create..."
																		className="h-[200px] max-h-[180px] bg-transparent"
																		{...field}
																	/>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</form>
												</Form>
												<DialogFooter>
													<DialogClose asChild>
														<Button
															type="button"
															variant="secondary"
														>
															Annuler
														</Button>
													</DialogClose>
													<DialogClose asChild>
														<Button
															type="submit"
															variant="default"
															onClick={() =>
																removeUserFromProject(
																	projectId,
																	user.user_id,
																)
															}
														>
															Sauvegarder
														</Button>
													</DialogClose>
												</DialogFooter>
											</DialogContent>
											
										</Dialog>
									</TableCell>
									<TableCell
										className={cn("px-4 py-1", {
											"pointer-events-none opacity-50":
												user.user_role === "owner" ||
												user.user_id === userId,
										})}
									>
										<div className="flex justify-end">
											<Dialog>
												<DialogTrigger asChild>
													<Button
														variant="secondary"
														size="sm"
														className="hover:bg-red-500"
													>
														<Delete className="mr-2 h-4 w-4" />
														Remove
													</Button>
												</DialogTrigger>
												<DialogContent className="sm:max-w-[425px]">
													<DialogHeader>
														<DialogTitle>
															Are you sure you
															want to remove this
															user?
														</DialogTitle>
														<DialogDescription>
															{user.username} will
															no longer have
															access to this
															project and all
															their tasks will be
															unassigned. This
															cannot be undone.
														</DialogDescription>
													</DialogHeader>
													<div className="flex items-center space-x-2">
														<div className="grid flex-1 gap-2"></div>
													</div>

													<DialogFooter>
														<DialogClose asChild>
															<Button
																type="button"
																variant="secondary"
															>
																Cancel
															</Button>
														</DialogClose>
														<DialogClose asChild>
															<Button
																type="submit"
																variant="destructive"
																onClick={() =>
																	removeUserFromProject(
																		projectId,
																		user.user_id,
																	)
																}
															>
																Delete{" "}
																{user.username}
															</Button>
														</DialogClose>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>
									</TableCell>
								</TableRow>
							),
					)}
				</TableBody>
			</Table>
		</div>
	);
}

export default UsersTable;
