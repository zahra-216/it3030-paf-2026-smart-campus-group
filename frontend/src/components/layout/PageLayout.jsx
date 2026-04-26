import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function PageLayout({ activePage, setActivePage, children }) {
    return (
        <div style={styles.wrapper}>
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <div style={styles.body}>
                <Topbar setActivePage={setActivePage} />
                <main style={styles.main}>
                    {children}
                </main>
                <footer style={styles.footer}>
                    <span style={styles.footerText}>© 2026 UniDesk · SLIIT Faculty of Computing · Smart Campus Operations Hub</span>
                </footer>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-body)",
    },
    body: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-off-white)",
    },
    main: {
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
    },
    footer: {
        backgroundColor: "var(--color-white)",
        borderTop: "var(--color-border)",
        padding: "0.6rem 1.5rem",
        textAlign: "center",
    },
    footerText: {
        fontSize: "0.72rem",
        color: "var(--color-text-light)",
    },
};