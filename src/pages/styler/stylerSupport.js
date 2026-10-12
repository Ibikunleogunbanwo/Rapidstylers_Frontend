import Support from "../users/pages/support";

// The customer support form and ticket list, unchanged: POST/GET /support_tickets
// accept a signed-in professional too and attribute the ticket to them. The
// dashboard shell skips its own H1 here because this page prints one.
const noPageTitle = () => {};
const StylerSupport = () => <Support setPageTitle={noPageTitle} />;

export default StylerSupport;
