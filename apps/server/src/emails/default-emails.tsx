import type React from "react";

interface DefaultEmailProps {
	firstName: string;
}

const DefaultEmails: React.FC<DefaultEmailProps> = ({ firstName }) => {
	return (
		<div>
			<h1>Hello {firstName}</h1>
		</div>
	);
};

export default DefaultEmails;
