export default function Logo() {
    return (
        <>
            <img src={`.${process.env.PUBLIC_URL}/logo512.webp`} alt="logo" className="logo-file" />
        </>
    )
}