import React from "react";

import { Command } from "cmdk";

import { type Cmd } from "~/store/cmd";

type Props = {
	commands: Cmd[];
	selectCallback?: () => void;
};

const Commands = ({ commands, selectCallback }: Props) => {
	const groupedCommands = commands.filter((cmd) => cmd.group);
	const nonGroupedCommands = commands.filter((cmd) => !cmd.group);

	// Sort non-grouped commands by priority
	nonGroupedCommands.sort((cmd1, cmd2) => cmd2.priority - cmd1.priority);

	// Organize grouped commands by group, then sort by average priority
	const groups: Record<string, Cmd[]> = {};
	groupedCommands.forEach((cmd) => {
		const group = cmd.group;
		if (!groups[group!]) {
			groups[group!] = [cmd];
			return;
		}

		if (group) groups[group]?.push(cmd);
	});

	// Sort each group internally by priority, and then sort groups by average priority
	const sortedGroups = Object.entries(groups)
		.map(([groupName, cmds]) => ({
			groupName,
			cmds: cmds.sort((cmd1, cmd2) => cmd2.priority - cmd1.priority),
			avgPriority:
				cmds.reduce((sum, cmd) => sum + cmd.priority, 0) / cmds.length,
		}))
		.sort((a, b) => b.avgPriority - a.avgPriority);

	return (
		<Command label="Command Menu" className="cmd">
			<Command.Input placeholder="Commande ou recherche..." />
			<Command.List>
				<Command.Empty>Aucun résultat trouvé.</Command.Empty>

				{/* Render non-grouped commands */}
				{nonGroupedCommands.map((cmd) => (
					<Command.Item
						key={cmd.id}
						onSelect={() => {
							console.log("cmdk:", cmd.id);
							cmd.action();
							selectCallback ? selectCallback() : null;
						}}
					>
						{cmd.icon}
						{cmd.label}
						<div cmdk-shortcuts="">
							<kbd key={cmd.shortcut.join(" ")}>
								{cmd.shortcut.join(" ")}
							</kbd>
						</div>
					</Command.Item>
				))}

				{/* Render grouped commands */}
				{sortedGroups.map(({ groupName, cmds }) => (
					<Command.Group
						key={groupName}
						heading={groupName.toUpperCase()}
						className="border-b py-1 text-muted-foreground"
					>
						{cmds.map((cmd) => (
							<Command.Item
								key={cmd.id}
								onSelect={() => {
									console.log("cmdk:", cmd.id);
									cmd.action();
									selectCallback ? selectCallback() : null;
								}}
							>
								{cmd.icon}
								{cmd.label}
								<div cmdk-shortcuts="">
									<kbd key={cmd.shortcut.join(" ")}>
										{cmd.shortcut.join(" ")}
									</kbd>
								</div>
							</Command.Item>
						))}
					</Command.Group>
				))}
			</Command.List>
		</Command>
	);
};

export default Commands;
