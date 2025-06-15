/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Metadata } from "next";

import Message from "~/components/Message";

export const metadata: Metadata = {
	title: "Create Project",
};

export default function createProjectPage() {
	return (
		<div className="flex justify-center">
			<div className="flex flex-col gap-4">
				<Message
						type="faint"
						description={
							<p className="py-2">Vous n’êtes assigné à aucun projet pour le moment.</p>
						}
						className="min-w-[600px]"
					>
						Veuillez rejoindre un projet pour accéder au tableau de bord.
				</Message>
			</div>
		</div>
		
	);
}
