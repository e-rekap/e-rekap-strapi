  # ── FEATURE AREA 4: SEARCH INPUT EDGE CASES ──────────────────────────────
@TC-012 @search @edge_case @negative
  # Assumption: Every query made only of symbols / emoji behaves like TC-011.
  #             "+", "&", "%" and "?" must be URL-encoded so they do not break
  #             the query string (e.g. "+" must not decode to spaces).
  Scenario Outline: Searching a symbol-only keyword shows zero results without errors
    When User types "<keyword>" into the search bar
    And User submits the search
    Then no server error page is displayed
    And the header shows "0 results found"
    And the result list is empty
    And an empty state message is displayed

    Examples:
      | keyword |
      | @@@@@@@ |
      | !!!!!!! |
      | $$$$$$$ |
      | %%%%%%% |
      | &&&&&&& |
      | ******* |
      | ??????? |
      | +++++++ |
      | ....... |
      | 😀😀😀  |

  @TC-013 @search @edge_case @positive
  # Assumption: Symbols around a valid word are ignored; matching uses the
  #             alphanumeric part only.
  Scenario: A valid keyword wrapped in special characters still returns its matches
    Given the catalog contains 50 items matching keyword "laptop"
    When User types "##laptop##" into the search bar
    And User submits the search
    Then the header shows "50 results found"
    And the result list displays only items related to "laptop"

  @TC-014 @search @edge_case @negative
  # Assumption: Whitespace only input is treated exactly like an empty query.
  Scenario: Submitting a whitespace only query keeps the initial view
    When User types "     " into the search bar
    And User submits the search
    Then the page remains in the initial "All Categories" view
    And NO "results found" header is displayed
    And no error message is shown

  @TC-015 @search @edge_case @positive
  # Assumption: Leading and trailing spaces are trimmed before searching.
  Scenario: Leading and trailing spaces are ignored in the query
    Given the catalog contains 50 items matching keyword "laptop"
    When User types "   laptop   " into the search bar
    And User submits the search
    Then the header shows "50 results found"
    And the result list displays only items related to "laptop"

  @TC-016 @search @edge_case @positive
  # Assumption: Search is case-insensitive.
  Scenario Outline: Keyword casing does not change the result count
    Given the catalog contains 50 items matching keyword "laptop"
    When User types "<keyword>" into the search bar
    And User submits the search
    Then the header shows "50 results found"

    Examples:
      | keyword |
      | LAPTOP  |
      | Laptop  |
      | lApToP  |

  @TC-017 @search @positive
  # Assumption: Enter key and the search icon trigger the same search.
  Scenario Outline: Search can be submitted by Enter key or search icon
    Given the catalog contains 50 items matching keyword "laptop"
    When User types "laptop" into the search bar
    And User submits the search by <method>
    Then the "results found" header is displayed
    And the header shows "50 results found"

    Examples:
      | method                    |
      | pressing Enter            |
      | clicking the search icon  |

  @TC-018 @search @security @negative
  # Assumption: Input is sanitized/escaped; scripts are never executed.
  Scenario: Script injection in the search bar is not executed
    When User types "<script>alert('xss')</script>" into the search bar
    And User submits the search
    Then no browser alert dialog appears
    And the keyword is displayed as plain text in the search bar
    And the page layout is not broken
    And no server error page is displayed

  @TC-019 @search @security @negative
  # Assumption: Queries are parameterized; injection strings do not widen results.
  Scenario: SQL injection string does not return the whole catalog
    When User types "' OR '1'='1" into the search bar
    And User submits the search
    Then no database or server error message is displayed
    And the header does NOT show the total catalog count
    And the result list contains only items literally matching the keyword, if any

  @TC-020 @search @edge_case @negative
  # Assumption: Input has a maximum length (Q10); longer input is truncated or
  #             rejected gracefully.
  Scenario: Very long query is handled gracefully
    Given User prepares a keyword of 500 characters
    When User types that keyword into the search bar
    And User submits the search
    Then the search bar holds at most the maximum allowed number of characters
    And no HTTP 414 or 500 error page is displayed
    And the page still renders the search bar, sidebar, and result area

  # ── FEATURE AREA 5: URL / DEEP LINK HANDLING ─────────────────────────────

  @TC-021 @url @deep_link @positive
  # Assumption: The "keyword" URL parameter drives the search state.
  Scenario: Opening a search URL directly pre-fills the query and shows results
    Given the catalog contains 50 items matching keyword "laptop"
    When User opens the URL "/en/hasil-pencarian?keyword=laptop"
    Then the search bar contains "laptop"
    And the header shows "50 results found"
    And the result list displays only items related to "laptop"

  @TC-022 @url @deep_link @edge_case @negative @defect_candidate
  # Assumption: Same rule as TC-011, but triggered via URL instead of typing.
  # Observed:   This URL returns "19231 results found" with all items.
  Scenario: Opening a URL with encoded hash symbols does not list everything
    When User opens the URL "/en/hasil-pencarian?keyword=%23%23%23%23%23%23%23"
    Then the search bar contains "#######"
    And the header shows "0 results found"
    And the result list is empty
    And an empty-state message is displayed

  @TC-023 @url @edge_case @negative
  # Assumption: A malformed percent-encoded parameter never causes a server error.
  Scenario: Malformed URL encoding in the keyword parameter is handled safely
    When User opens the URL "/en/hasil-pencarian?keyword=%E0%A4%A"
    Then no HTTP 400 or 500 error page is displayed
    And the page still renders the search bar, sidebar, and result area

  @TC-024 @url @state @positive
  Scenario: Refreshing the page keeps the submitted query and results
    Given User has searched "laptop" and sees "50 results found"
    When User refreshes the browser page
    Then the search bar still contains "laptop"
    And the header still shows "50 results found"

  @TC-025 @url @state @positive
  # Assumption: Browser Back restores the previous query (Q13).
  Scenario: Browser Back from a detail page restores the previous search
    Given User has searched "laptop" and sees "50 results found"
    And User opens the detail page of the first result card
    When User clicks the browser Back button
    Then User is returned to the search page
    And the search bar contains "laptop"
    And the header shows "50 results found"

  # ── FEATURE AREA 6: CLEAR & RE-SEARCH ────────────────────────────────────

  @TC-026 @search @clear @positive
  # Assumption: The (X) clear button resets the page to the initial state.
  Scenario: Clearing the search bar returns the page to its initial state
    Given User has searched "laptop" and sees "50 results found"
    When User clicks the clear (X) button in the search bar
    Then the search bar is empty
    And NO "results found" header is displayed
    And the result list displays items from all categories

  @TC-027 @search @positive
  Scenario: Submitting a new keyword replaces the previous results
    Given User has searched "laptop" and sees "50 results found"
    When User replaces the keyword with "ikan"
    And User submits the search
    Then the header shows the number of items matching "ikan"
    And the result list displays only items related to "ikan"
    And no item related only to "laptop" remains in the list

  @TC-028 @search @filter @positive
  # Assumption: A new keyword resets the category filter to "All Categories" (Q11).
  Scenario: A new search while a category is active resets the filter
    Given User has searched "laptop"
    And User has checked the "Promo" filter
    When User replaces the keyword with "ikan"
    And User submits the search
    Then the "All Categories" filter is checked
    And the "Promo" filter is unchecked

  @TC-029 @search @edge_case @negative
  Scenario: Rapid double submission does not duplicate results
    Given the catalog contains 50 items matching keyword "laptop"
    When User types "laptop" into the search bar
    And User clicks the search icon twice rapidly
    Then the header shows "50 results found"
    And no result card appears more than once in the list

  # ── FEATURE AREA 7: SEARCH + FILTER COMBINATION ──────────────────────────

  @TC-030 @search @filter @positive
  Scenario: Filtering by category after a search narrows the searched results
    Given User has searched "laptop" and sees "50 results found"
    When User checks the "Promo" filter
    Then every visible result card shows the "Promo" category badge
    And every visible result card is related to "laptop"
    And the header count updates to the number of Promo items matching "laptop"

  @TC-031 @filter @multi_select @positive
  # Assumption: Checking "All Categories" clears every individual selection.
  Scenario: Re-checking "All Categories" restores the full listing
    Given User has checked the "Product" filter
    And User has checked the "Article" filter
    When User checks the "All Categories" filter
    Then the "Product" and "Article" filters are unchecked
    And the "All Categories" filter is checked
    And the result list displays items from all categories

  @TC-032 @filter @negative
  # Assumption: Unchecking the only active sub-category falls back to
  #             "All Categories" instead of an empty selection.
  Scenario: Unchecking the only selected sub-category falls back to "All Categories"
    Given User has checked the "Promo" filter only
    When User unchecks the "Promo" filter
    Then the "All Categories" filter is checked
    And the result list displays items from all categories

  @TC-033 @filter @multi_select @edge_case
  # Assumption: Checking all five sub-categories equals "All Categories" (Q12).
  Scenario: Manually checking every sub-category is equivalent to "All Categories"
    When User checks "Product", "Promo", "Article", "Others", and "Location"
    Then the "All Categories" filter is checked
    And the result list displays items from all categories
    And the total listed equals the "All Categories" count of 3030

  @TC-034 @filter @edge_case @positive
  Scenario: Filtering a category with a single item shows exactly one card
    When User checks the "Location" filter
    Then exactly 1 result card is displayed
    And that card shows the "Location" category badge
    And no load-more or pagination control is displayed

  # ── FEATURE AREA 8: RESULT CARD & FLOATING ACTION BAR ────────────────────

  @TC-035 @results @navigation @positive
  # Assumption: The whole card is clickable (General Assumption 6).
  Scenario: Clicking a result card opens its detail page
    Given the result list shows the card "Up To IDR 200K Off – MAPEMALL"
    When User clicks the card body
    Then the detail page of "Up To IDR 200K Off – MAPEMALL" is opened

  @TC-036 @results @navigation @positive
  Scenario: Clicking the right chevron opens the same detail page
    Given the result list shows the card "Up To IDR 200K Off – MAPEMALL"
    When User clicks the right chevron of that card
    Then the detail page of "Up To IDR 200K Off – MAPEMALL" is opened

  @TC-037 @floating_bar @positive
  Scenario Outline: Each floating action bar button opens its destination
    When User clicks "<action>" on the floating action bar
    Then <expected>

    Examples:
      | action    | expected                                   |
      | Login     | the login page is opened                   |
      | Compare   | the compare feature is opened              |
      | Poinseru  | the Poinseru page is opened                |
      | Education | the Education page is opened               |
      | Tanya     | the Tanya help or chat panel is opened     |

  @TC-038 @floating_bar @ui @negative
  # Observed: The floating bar overlaps the third result card in the viewport.
  Scenario: The floating action bar never blocks a result card permanently
    Given the result list shows at least 3 result cards
    When User scrolls to the bottom of the result list
    Then the last result card is fully visible above the floating action bar
    And the title and chevron of every card can be clicked

  # ── FEATURE AREA 9: PAGINATION / LOAD MORE (Q6) ──────────────────────────

  @TC-039 @pagination @positive
  Scenario: Loading more results appends new items without duplicates
    Given User has searched "laptop" and sees "50 results found"
    When User scrolls to the end of the currently loaded list
    Then the next batch of results is appended to the list
    And no result card appears more than once
    And the total number of loaded cards never exceeds 50

  @TC-040 @pagination @edge_case
  Scenario: Loading stops once every result is displayed
    Given User has searched "laptop" and all 50 results are loaded
    When User scrolls to the bottom of the list
    Then no loading indicator is displayed
    And no further request for more results is sent

  # ── FEATURE AREA 10: LANGUAGE SWITCH ─────────────────────────────────────

  @TC-041 @language @positive
  # Assumption: Switching language keeps the active query.
  Scenario: Switching from EN to ID keeps the current search
    Given User has searched "laptop" on the EN page
    When User clicks the "ID" language toggle
    Then the URL path changes to "/id/hasil-pencarian"
    And the search bar still contains "laptop"
    And the page labels are displayed in Bahasa Indonesia
