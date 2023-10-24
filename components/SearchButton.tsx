'use client'

import { AlgoliaButton } from 'pliny/search/AlgoliaButton'
import { KBarButton } from 'pliny/search/KBarButton'
import { SITE } from 'config/const'
import { SearchIcon } from '@chakra-ui/icons'
import { HStack, Kbd, Text, VisuallyHidden, chakra } from '@chakra-ui/react'
import { useState, useEffect } from 'react'

const ACTION_KEY_DEFAULT = ['Ctrl', 'Control']
const ACTION_KEY_APPLE = ['⌘', 'Command']

const SearchButton = () => {
  const [actionKey, setActionKey] = useState<string[]>(ACTION_KEY_APPLE)
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
    if (!isMac) {
      setActionKey(ACTION_KEY_DEFAULT)
    }
  }, [])

  if (SITE.search && (SITE.search.provider === 'algolia' || SITE.search.provider === 'kbar')) {
    const SearchButtonWrapper = SITE.search.provider === 'algolia' ? AlgoliaButton : KBarButton

    return (
      <SearchButtonWrapper aria-label="Search" className="mx-6 w-1/2 px-4">
        <chakra.button
          flex="1"
          type="button"
          mx="6"
          lineHeight="1.2"
          w="100%"
          bg="gray.400"
          whiteSpace="nowrap"
          display={{ base: 'none', sm: 'flex' }}
          alignItems="center"
          color="gray.600"
          _dark={{ bg: 'gray.700', color: 'gray.400' }}
          py="3"
          px="4"
          outline="0"
          _focus={{ shadow: 'outline' }}
          shadow="base"
          rounded="lg"
        >
          <SearchIcon />
          <HStack w="full" ml="3" spacing="4px">
            <Text textAlign="left" flex="1">
              Search
            </Text>
            <HStack spacing="4px">
              <VisuallyHidden>Press</VisuallyHidden>
              <Kbd rounded="2px">
                <chakra.div as="abbr" title={actionKey[1]} textDecoration="none !important">
                  {actionKey[0]}
                </chakra.div>
              </Kbd>
              <VisuallyHidden>and</VisuallyHidden>
              <Kbd rounded="2px">K</Kbd>
              <VisuallyHidden>to search</VisuallyHidden>
            </HStack>
          </HStack>
        </chakra.button>
      </SearchButtonWrapper>
    )
  }
}

export default SearchButton
