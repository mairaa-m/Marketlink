import { DotLottieReact } from '@lottiefiles/dotlottie-react'

const loaderSrc = 'https://lottie.host/986cbd16-20c8-498e-b83e-7406729fb4ad/2jALq0UnWZ.lottie'

export default function Loader({ done = false }) {
  return (
    <div className={`loader-screen loader-screen--lottie ${done ? 'is-done' : ''}`} aria-hidden={done}>
      <DotLottieReact
        src={loaderSrc}
        loop
        autoplay
        className="loader-lottie-animation"
      />
    </div>
  )
}
