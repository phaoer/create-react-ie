#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const fsExtra = require("fs-extra");
const path = require("path");
const { program } = require("commander");
const chalk = require("chalk");
const figlet = require("figlet");
const prompts = require("prompts");
const _ = require("underscore");

let packageJson = {};
let projectName = null;
let directoryPath = null;

try {
	packageJson = JSON.parse(
		fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
	);
} catch (error) {
	console.log(error);
	process.exit(1);
}

const { name, description, version } = packageJson;

program.name(name).description(description).version(version);

program
	.on("--help", () => {
		console.log(
			"\r\n" +
				chalk.white.bgBlueBright.bold(
					figlet.textSync("create-react-ie", {
						font: "Standard",
						horizontalLayout: "default",
						verticalLayout: "default",
						width: 80,
						whitespaceBreak: true,
					})
				)
		);
	})
	.arguments("<project-directory>")
	.usage(`${chalk.green("<project-directory>")} [option]`)
	.action((name) => {
		projectName = name;
	})
	.option("-p, --port [port]", "webpack dev server port", 3000)
	.parse(process.argv);

const { port } = program.opts();

if (projectName) {
	directoryPath = path.join(process.cwd(), projectName);

	console.log(chalk.bold("\nEnvironment Info:\n"));
	console.log(`  current version of ${name}: ${version}\n`);
	console.log(`  create path: ${directoryPath}\n`);

	if (fs.existsSync(directoryPath)) {
		(async () => {
			console.log(chalk.bold("Configure:\n"));

			const res = await prompts({
				type: "select",
				name: "isOverwrite",
				message: "The folder already exists. Do you want to overwrite it?",
				choices: [
					{ title: "overwrite", value: true },
					{ title: "exit", value: false },
				],
				initial: 0,
			});

			const { isOverwrite } = res;

			if (isOverwrite) {
				fs.rmSync(directoryPath, { recursive: true });

				run();
			} else {
				process.exit(1);
			}
		})();
	} else {
		run();
	}
} else {
	process.exit(1);
}

function run() {
	console.log(chalk.bold("\nInstall:\n"));

	fs.mkdirSync(directoryPath, { recursive: true });

	fsExtra.copySync(path.join(__dirname, "templates", "copy"), directoryPath);

	fs.writeFileSync(
		path.join(directoryPath, "package.json"),
		_.template(
			fs.readFileSync(
				path.join(__dirname, "templates", "package.json.tmpl"),
				"utf-8"
			)
		)({
			projectName,
		}),
		{ flag: "w" }
	);

	fs.writeFileSync(
		path.join(directoryPath, "webpack.config.js"),
		_.template(
			fs.readFileSync(
				path.join(__dirname, "templates", "webpack.config.js.tmpl"),
				"utf-8"
			)
		)({
			port,
		}),
		{ flag: "w" }
	);

	console.log(`  Start install dependencies\n`);

	process.chdir(directoryPath);

	execSync("npm install", { stdio: "inherit" });

	console.log(`\n  npm install completed successfully\n`);

	console.log(`  To start development. run ${chalk.green("npm start")}\n`);

	process.exit(1);
}
