'use client'

import Image from './Image'
import Link from './Link'
import Ticker from 'framer-motion-ticker'
const tickers = Array.from({ length: 6 })

const Card = ({ title, description, imgSrc, href }) => (
  <div className="md p-4 sm:w-1/2 xl:w-1/3">
    <div
      className={`${
        imgSrc && 'h-full'
      }  relative overflow-hidden rounded-xl border-2 border-gray-200 border-opacity-60 dark:border-gray-700`}
    >
      {imgSrc &&
        (href ? (
          <Link href={href} aria-label={`Link to ${title}`}>
            <Image
              alt={title}
              src={imgSrc}
              className="object-cover object-center transition duration-300 ease-out hover:scale-125 hover:ease-in md:h-36 lg:h-48"
              width={544}
              height={306}
            />
          </Link>
        ) : (
          <Image
            alt={title}
            src={imgSrc}
            className="object-cover object-center transition duration-300 ease-out hover:scale-125 hover:ease-in md:h-36 lg:h-48"
            width={544}
            height={306}
          />
        ))}
      <div className="p-6">
        <h2 className="mb-3 text-2xl font-bold leading-8 tracking-tight">
          {href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">{description}</p>
        {href && (
          <Link
            href={href}
            className="absolute bottom-4 left-6 right-6 text-base font-medium leading-6 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label={`Link to ${title}`}
          >
            <Ticker duration={3} direction={1}>
              {tickers.map((item, index) => (
                <div key={index} className="mr-4 text-2xl font-medium leading-6 text-primary-500 ">
                  &rarr;
                </div>
              ))}
            </Ticker>
          </Link>
        )}
      </div>
    </div>
  </div>
)

export default Card
