import "./Header.css";

export default function Header() {
    return (
      <h1>
        Cat or Dog?{" "}
        <a
          href="https://github.com/hnthap/cat-or-dog"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://img.shields.io/github/stars/hnthap/cat-or-dog?style=social"
            alt="GitHub Stars"
          />
        </a>
      </h1>
    );
}