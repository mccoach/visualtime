<template>

  <!--
    组件的根容器。
    - .custom-countdown: 标识这是一个自定义倒计时组件，用于特定样式作用域。
    - .card: 应用在 `global.css` 中定义的通用卡片样式，提供统一的背景、圆角和阴影。
  -->
  <div
    class="custom-countdown card"
  >

    <!--
      头部区域容器。
      - .custom-countdown-header: 专门用于头部区域的样式。
      - .three-column-header: 【新增】应用三栏网格布局的特定样式类。
    -->
    <div
      class="custom-countdown-header three-column-header"
    >
      <!--
        【新增】头部左侧区域容器。
        - .header-zone-left: Grid布局中的第一列，内容将靠左对齐。
      -->
      <div
        class="header-zone-left"
      >
        <!--
          模块标题。
          - .title: 应用标题的特定样式。
          - 内容 "自定义倒计时" 硬编码为该模块的名称。
        -->
        <h3
          class="title"
        >
          自定义倒计时
        </h3>
      </div>
      
      <!--
        【新增】头部中间区域容器。
        - .header-zone-center: Grid布局中的第二列，内容将水平居中。
      -->
      <div
        class="header-zone-center"
      >
        <!--
          "添加倒计时" 按钮。
          - .button, .button-primary, .add-new-event-btn: 应用通用按钮、主色按钮和特定功能按钮的样式。
          - @click="openAddModal": 点击时调用 `openAddModal` 方法来打开添加/编辑弹窗。
        -->
        <button
          class="button button-primary add-new-event-btn"
          @click="openAddModal"
        >
          添加倒计时
        </button>
      </div>

      <!--
        头部右侧功能按钮容器。
        - .header-actions: 用于包裹所有右侧操作按钮，并应用Flex布局。
        - .header-zone-right: 【新增】Grid布局中的第三列，内容将靠右对齐。
      -->
      <div
        class="header-actions header-zone-right"
      >
        <!--
          批量删除按钮。
          - v-if: 仅在 `isMultiSelectMode` 为真 (多选模式) 且 `selectedEventIds.size` 大于0 (有选中项) 时才渲染此按钮。
          - .button, .button-danger, .bulk-delete-btn: 应用通用按钮、危险操作按钮和特定功能按钮的样式。
          - @click="bulkDelete": 点击时调用 `bulkDelete` 方法执行批量删除。
          - :title: 鼠标悬停时显示的提示文本，动态显示选中的项目数量。
        -->
        <button
          v-if="isMultiSelectMode && selectedEventIds.size > 0"
          class="button button-danger bulk-delete-btn"
          @click="bulkDelete"
          :title="`删除选中的 ${selectedEventIds.size} 个项目`"
        >
          <!--
            删除图标 (垃圾桶)。
            - 这是一个内联SVG，用于显示图标，比图片格式更轻量且可定制。
          -->
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          批量删除
        </button>

        <!--
          【修改】排序和多选按钮的连体按钮组。
          - .joined-btn-group: 应用连体按钮组的样式，使内部按钮边框合并。
        -->
        <div
          class="joined-btn-group"
        >
          <!--
            【修改】合并后的单个排序按钮。
            - .joined-btn, .action-btn: 应用连体按钮和操作按钮的样式。
            - @click="cycleSortOrder": 点击时调用 `cycleSortOrder` 方法在不同排序模式间循环切换。
            - :title: 动态显示当前排序模式的提示文本。
          -->
          <button
            class="joined-btn action-btn"
            :class="{ active: sortOrder !== 'manual' }"
            @click="cycleSortOrder"
            :title="`当前排序: ${sortOrder === 'manual' ? '手动' : (sortOrder === 'asc' ? '升序' : '降序')}`"
          >
            <!--
              【新增】手动/默认排序图标 (列表)。
              - v-if: 当 `sortOrder` 为 'manual' 时显示此SVG。
            -->
            <svg
              v-if="sortOrder === 'manual'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            > 
              <!-- 左侧向上箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="9" y1="3" x2="9" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 左斜线 -->
                <line x1="9" y1="3" x2="4" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
              
              <!-- 右侧向下箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="15" y1="3" x2="15" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 右斜线 -->
                <line x1="20" y1="14" x2="15" y2="21" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!--
              【新增】升序图标 (向上箭头)。
              - v-else-if: 当 `sortOrder` 为 'asc' 时显示此SVG。
            -->
            <svg
              v-else-if="sortOrder === 'asc'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- 左侧向上箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="9" y1="1" x2="9" y2="23" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
                <!-- 左斜线 -->
                <line x1="9" y1="1" x2="4" y2="10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
              
              <!-- 右侧向下箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="15" y1="3" x2="15" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 右斜线 -->
                <line x1="20" y1="14" x2="15" y2="21" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <!--
              【新增】降序图标 (向下箭头)。
              - v-else: 当以上条件都不满足 (即 `sortOrder` 为 'desc') 时显示此SVG。
            -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- 左侧向上箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="9" y1="3" x2="9" y2="21" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
                <!-- 左斜线 -->
                <line x1="9" y1="3" x2="4" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
              
              <!-- 右侧向下箭头（极简风格） -->
                <!-- 竖线 -->
                <line x1="15" y1="1" x2="15" y2="23" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
                <!-- 右斜线 -->
                <line x1="20" y1="14" x2="15" y2="23" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </button>
          
          <!--
            多选切换按钮。
            - .joined-btn, .action-btn: 应用连体和操作按钮样式。
            - :class="{ active: isMultiSelectMode }": 当 `isMultiSelectMode` 为真时，动态添加 'active' 类以高亮按钮。
            - @click="toggleMultiSelectMode": 点击时调用 `toggleMultiSelectMode` 方法切换多选模式。
            - title: 鼠标悬停时的提示文本。
          -->
          <button
            class="joined-btn action-btn"
            :class="{ active: isMultiSelectMode }"
            @click="toggleMultiSelectMode"
            title="切换多选模式"
          >
            <!-- 复选框打勾图标SVG -->
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!--
      事件编辑/添加弹窗的遮罩层。
      - v-if="isModalOpen": 当 `isModalOpen` 状态为真时，渲染此弹窗。
      - .modal-overlay: 定义了全屏、半透明的遮罩层样式。
      - @click.self="closeModal": `.self` 修饰符确保只有在直接点击遮罩层本身时才调用 `closeModal` 方法，点击其子元素（弹窗内容）时不会触发。
    -->
    <div
      v-if="isModalOpen"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <!--
        弹窗内容容器。
        - .modal-content: 定义了弹窗的背景、尺寸、边距等样式。
        - @click.stop: 阻止点击事件继续向上传播（冒泡），防止触发遮罩层的关闭事件。
      -->
      <div
        class="modal-content"
        @click.stop
      >
        <!--
          弹窗标题。
          - .modal-title: 标题的特定样式。
          - {{ modalTitle }}: 动态绑定 `modalTitle` ref 的值，显示 "添加..." 或 "编辑..."。
        -->
        <h3
          class="modal-title"
        >
          {{ modalTitle }}
        </h3>

        <!-- 统一的表单输入区域 -->
        <div
          class="modal-form"
        >
          <!-- 年月日输入组 -->
          <div
            class="input-group"
          >
            <!--
              年份输入框。
              - ref="formYearRef": 将此DOM元素注册为 `formYearRef` 引用。
              - v-model="eventForm.year": 双向绑定到 `eventForm.year` 状态。
              - @...: 绑定了一系列事件处理器，用于输入验证、导航、滚轮调整等交互。
            -->
            <input
              ref="formYearRef"
              v-model="eventForm.year"
              type="text"
              class="input"
              placeholder="年"
              @input="formInteractionHandler.onInput($event, 'year')"
              @keydown="formInteractionHandler.onKeydown($event, 'year')"
              @focus="formInteractionHandler.onFocus($event, 'year')"
              @blur="formInteractionHandler.onBlur('year')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'year')"
            >
            <!-- 日期格式分隔符 -->
            <span
              class="date-separator"
            >
              -
            </span>
            <!-- 月份输入框，逻辑同上 -->
            <input
              ref="formMonthRef"
              v-model="eventForm.month"
              type="text"
              class="input"
              placeholder="月"
              @input="formInteractionHandler.onInput($event, 'month')"
              @keydown="formInteractionHandler.onKeydown($event, 'month')"
              @focus="formInteractionHandler.onFocus($event, 'month')"
              @blur="formInteractionHandler.onBlur('month')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'month')"
            >
            <!-- 日期格式分隔符 -->
            <span
              class="date-separator"
            >
              -
            </span>
            <!-- 日期输入框，逻辑同上 -->
            <input
              ref="formDayRef"
              v-model="eventForm.day"
              type="text"
              class="input"
              placeholder="日"
              @input="formInteractionHandler.onInput($event, 'day')"
              @keydown="formInteractionHandler.onKeydown($event, 'day')"
              @focus="formInteractionHandler.onFocus($event, 'day')"
              @blur="formInteractionHandler.onBlur('day')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'day')"
            >
          </div>

          <!-- 时分秒输入组 -->
          <div
            class="input-group"
          >
            <!-- 小时输入框，逻辑同上 -->
            <input
              ref="formHourRef"
              v-model="eventForm.hour"
              type="text"
              class="input"
              placeholder="时"
              @input="formInteractionHandler.onInput($event, 'hour')"
              @keydown="formInteractionHandler.onKeydown($event, 'hour')"
              @focus="formInteractionHandler.onFocus($event, 'hour')"
              @blur="formInteractionHandler.onBlur('hour')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'hour')"
            >
            <!-- 时间格式分隔符 -->
            <span
              class="date-separator"
            >
              :
            </span>
            <!-- 分钟输入框，逻辑同上 -->
            <input
              ref="formMinuteRef"
              v-model="eventForm.minute"
              type="text"
              class="input"
              placeholder="分"
              @input="formInteractionHandler.onInput($event, 'minute')"
              @keydown="formInteractionHandler.onKeydown($event, 'minute')"
              @focus="formInteractionHandler.onFocus($event, 'minute')"
              @blur="formInteractionHandler.onBlur('minute')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'minute')"
            >
            <!-- 时间格式分隔符 -->
            <span
              class="date-separator"
            >
              :
            </span>
            <!-- 秒数输入框，逻辑同上 -->
            <input
              ref="formSecondRef"
              v-model="eventForm.second"
              type="text"
              class="input"
              placeholder="秒"
              @input="formInteractionHandler.onInput($event, 'second')"
              @keydown="formInteractionHandler.onKeydown($event, 'second')"
              @focus="formInteractionHandler.onFocus($event, 'second')"
              @blur="formInteractionHandler.onBlur('second')"
              @wheel.prevent="formInteractionHandler.onWheel($event, 'second')"
            >
          </div>

          <!-- 事件名称输入框，逻辑同上 -->
          <input
            ref="formNameRef"
            v-model="eventForm.name"
            type="text"
            class="input event-name-input"
            placeholder="事件名称（可选）"
            @keydown="formInteractionHandler.onKeydown($event, 'name')"
            @focus="formInteractionHandler.onFocus($event, 'name')"
            @blur="formInteractionHandler.onBlur('name')"
          >
        </div>

        <!-- 弹窗操作按钮区域 -->
        <div
          class="modal-actions"
        >
          <!--
            取消按钮。
            - @click="closeModal": 点击时调用 `closeModal` 方法关闭弹窗。
          -->
          <button 
            class="button button-secondary" 
            @click="closeModal"
          >
            取消
          </button>
          <!--
            保存按钮。
            - @click="saveEvent": 点击时调用 `saveEvent` 方法保存事件。
            - :disabled="!isFormValid": 动态绑定 disabled 属性。当 `isFormValid` 计算属性为 false 时，禁用此按钮。
          -->
          <button
            class="button button-primary"
            @click="saveEvent"
            :disabled="!isFormValid"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!--
      事件列表容器。
      - ref="eventsListRef": 将此DOM元素注册为 `eventsListRef` 引用，用于初始化 Sortable.js 实现拖拽排序。
    -->
    <div
      class="events-list"
      ref="eventsListRef"
    >
      <!--
        事件列表渲染循环。
        - v-for: 遍历 `events` 数组，为每个 `event` 对象创建一个 `div.event-container`。
        - :key="event.id": 为每个循环项提供唯一的、稳定的键，对性能优化和DOM复用至关重要。
      -->
      <div
        v-for="event in events"
        :key="event.id"
        :ref="el => eventItemRefs[event.id] = el"
        class="event-container"
        :class="{
          'pending-copy': pendingCopyId === event.id,
          'pending-delete': pendingDeleteId === event.id,
          'is-selected': isMultiSelectMode && selectedEventIds.has(event.id)
        }"
        @click="handleItemClick(event)"
        @mouseenter="handleEventMouseEnter(event.id)"
        @mouseleave="handleEventMouseLeave"
        @mousemove="handleEventMouseMove"
      >
        <!--
          【新增】:ref="el => eventItemRefs[event.id] = el"
          为每个事件容器绑定一个ref，存储到 `eventItemRefs` 对象中，键为事件ID。
          这对于框选功能计算每个条目的位置是必需的。
        -->
        <!--
          类名动态绑定。
          - 'pending-copy': 当 `pendingCopyId` 等于当前事件ID时，应用等待复制的脉冲动画样式。
          - 'pending-delete': 当 `pendingDeleteId` 等于当前事件ID时，应用等待删除的脉冲动画样式。
          - 'is-selected': 当处于多选模式且当前事件ID在 `selectedEventIds` 集合中时，应用选中样式。
        -->
        <!--
          事件监听器。
          - @click="handleItemClick(event)": 在多选模式下处理点击事件，切换选中状态。
          - @mouseenter, @mouseleave, @mousemove: 处理鼠标悬停、离开和移动事件，用于显示快捷键提示浮层。
        -->
        
        <!-- 桌面端左侧拖拽手柄 -->
        <div 
          class="drag-handle drag-handle-left desktop-only" 
          title="拖动排序"
        >
          <!-- 手柄图标SVG -->
          <svg width="10" height="24" fill="currentColor">
            <circle cx="8" cy="6" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="8" cy="18" r="1.5"/>
          </svg>
        </div>
        <!-- 桌面端右侧拖拽手柄 -->
        <div 
          class="drag-handle drag-handle-right desktop-only" 
          title="拖动排序"
        >
          <!-- 手柄图标SVG -->
          <svg width="10" height="24" fill="currentColor">
            <circle cx="2" cy="6" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/>
            <circle cx="8" cy="12" r="1.5"/>
            <circle cx="2" cy="18" r="1.5"/>
          </svg>
        </div>

        <!-- 事件条目内容 -->
        <div
          class="event-item"
        >
          <!-- 移动端全区域拖拽手柄 -->
          <div 
            class="drag-blank-area mobile-only" 
            title="拖动排序"
          ></div>

          <!--
            事件日期时间显示。
            - :ref: 将DOM元素注册到 `elementRefs` 中，用于字体自适应计算。
            - :style: 动态绑定 `fontStyles` 对象中对应事件ID的字体样式。
            - {{ event.dateTimeDesc }}: 显示格式化后的日期时间描述。
          -->
          <div
            class="event-date-column"
            :ref="el => setElementRef(el, event.id, 'date')"
            :style="fontStyles[event.id]?.date"
          >
            {{ event.dateTimeDesc }}
          </div>

          <!-- 事件名称显示 -->
          <div
            class="event-name-column"
          >
            {{ event.name }}
          </div>

          <!--
            倒计时显示。
            - :ref, :style: 逻辑同上，用于字体自适应。
            - v-html="event.finalDisplay": 使用 `v-html` 渲染包含HTML标签（如 `<span>`）的倒计时文本。
          -->
          <div
            class="event-countdown-column"
            :ref="el => setElementRef(el, event.id, 'countdown')"
            :style="fontStyles[event.id]?.countdown"
          >
            <span
              v-html="event.finalDisplay"
            ></span>
          </div>

          <!--
            操作菜单容器。
            - .absolute-menu: 应用绝对定位，使其浮动在右上角。
            - @click.stop: 阻止点击事件冒泡。
          -->
          <div
            class="menu-container absolute-menu"
            @click.stop
          >
            <!--
              菜单触发按钮（三个点）。
              - @click="toggleMenu(event.id)": 点击时调用 `toggleMenu` 方法，传入当前事件ID以打开或关闭对应菜单。
            -->
            <button 
              class="menu-btn" 
              @click="toggleMenu(event.id)"
            >
              ⋮
            </button>
            <!--
              下拉菜单。
              - v-if="activeMenu === event.id": 只有当 `activeMenu` 的值等于当前事件的ID时，才渲染此菜单。
            -->
            <div 
              v-if="activeMenu === event.id" 
              class="dropdown-menu"
            >
              <!-- 编辑按钮 -->
              <button 
                @click="handleEdit(event)" 
                class="menu-item"
              >
                编辑
              </button>
              <!-- 复制按钮 -->
              <button 
                @click="handleCopy(event)" 
                class="menu-item"
              >
                复制
              </button>
              <!-- 删除按钮 -->
              <button 
                @click="handleMenuDelete(event.id)" 
                class="menu-item delete"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 单位和精度切换按钮行 -->
        <div
          class="button-row horizontal-between"
        >
          <!-- 单位切换按钮组 -->
          <div
            class="joined-btn-group unit-btn-group"
          >
            <!--
              单位按钮循环。
              - v-for: 遍历 `unitOptions` 数组。
              - :key="unit.value": 使用单位值作为唯一键。
              - :class: 当 `event.unit` 等于当前 `unit.value` 时，添加 'active' 类。
              - @click.stop: 点击时调用 `handleUnitChange`，并阻止事件冒泡。
            -->
            <button
              v-for="unit in unitOptions"
              :key="unit.value"
              :class="[
                'precision-btn', 
                'joined-btn', 
                { active: event.unit === unit.value }
              ]"
              @click.stop="handleUnitChange(event.id, unit.value)"
            >
              {{ unit.label }}
            </button>
          </div>
          <!-- 小数精度切换按钮组 -->
          <div
            class="joined-btn-group precision-btn-group"
          >
            <!--
              精度按钮循环。
              - v-for: 遍历 `precisionOptions` 数组。
              - :key="p.value": 使用精度值作为唯一键。
              - :class: 当 `event.decimalPrecision` 等于当前 `p.value` 时，添加 'active' 类；当 `isDecimalDisabled` 返回真时，添加 'disabled' 类。
              - @click.stop: 点击时调用 `handlePrecisionChange`，并阻止事件冒泡。
              - :disabled: 当 `isDecimalDisabled` 返回真时，禁用按钮。
            -->
            <button
              v-for="p in precisionOptions"
              :key="p.value"
              :class="[
                'decimal-btn', 
                'joined-btn', 
                {
                  active: event.decimalPrecision === p.value,
                  disabled: isDecimalDisabled(event.unit, p.value)
                }
              ]"
              @click.stop="handlePrecisionChange(event.id, p.value)"
              :disabled="isDecimalDisabled(event.unit, p.value)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </div>
      <!--
        当事件列表为空时的提示信息。
        - v-if="events.length === 0": 当 `events` 数组为空时渲染此段落。
      -->
      <p 
        v-if="events.length === 0" 
        class="empty-tip"
      >
        暂无自定义倒计时，请添加
      </p>
    </div>

    <!--
      【新增】框选（Marquee Select）的矩形选框。
      - v-if="isMarqueeSelecting": 当 `isMarqueeSelecting` 为真时显示。
      - .marquee-select-box: 应用选框的样式。
      - :style: 动态绑定选框的 left, top, width, height 属性，使其跟随鼠标拖拽。
    -->
    <div
      v-if="isMarqueeSelecting"
      class="marquee-select-box"
      :style="{
        left: marqueeBox.x + 'px',
        top: marqueeBox.y + 'px',
        width: marqueeBox.width + 'px',
        height: marqueeBox.height + 'px'
      }"
    ></div>
  </div>

  <!--
    快捷键操作提示浮层。
    - <Transition>: Vue的内置组件，用于实现元素的进入/离开过渡动画。
    - name="hint-fade": 指定使用的过渡动画类名（如 .hint-fade-enter-active）。
  -->
  <Transition
    name="hint-fade"
  >
    <!--
      提示浮层容器。
      - v-if: 当 `showOperationHint` 和 `hoveredEventId` 都为真，且没有待确认操作时显示。
      - .operation-hint: 提示浮层的特定样式。
      - :style: 动态设置浮层的位置，使其跟随鼠标。
    -->
    <div
      v-if="showOperationHint && hoveredEventId && !pendingDeleteId && !pendingCopyId"
      class="operation-hint"
      :style="{ 
        left: mousePosition.x + 'px', 
        top: mousePosition.y + 'px' 
      }"
    >
      <!-- 提示内容 -->
      <div
        class="hint-content"
      >
        <!-- 编辑提示 -->
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Space  或 / 键
          </span>
          <span
            class="hint-action"
          >
            编辑
          </span>
        </div>
        <!-- 复制提示 -->
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Insert 或 + 键
          </span>
          <span
            class="hint-action"
          >
            复制
          </span>
        </div>
        <!-- 删除提示 -->
        <div
          class="hint-item"
        >
          <span
            class="hint-key"
          >
            按 Delete 或 - 键
          </span>
          <span
            class="hint-action"
          >
            删除
          </span>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 确认复制操作的提示浮层，逻辑同上 -->
  <Transition
    name="hint-fade"
  >
    <div
      v-if="pendingCopyId && pendingCopyId === hoveredEventId"
      class="copy-confirm-hint"
      :style="{ 
        left: mousePosition.x + 'px', 
        top: mousePosition.y + 'px' 
      }"
    >
      再按一次 Insert 或 + 确认复制
    </div>
  </Transition>
  
  <!-- 确认删除操作的提示浮层，逻辑同上 -->
  <Transition
    name="hint-fade"
  >
    <div
      v-if="pendingDeleteId && pendingDeleteId === hoveredEventId"
      class="delete-confirm-hint"
      :style="{ 
        left: mousePosition.x + 'px', 
        top: mousePosition.y + 'px' 
      }"
    >
      再按一次 Delete 或 - 确认删除
    </div>
  </Transition>

</template>

<script setup>
// ========== 依赖导入 ==========

import { 
  ref,
  computed,
  onMounted,
  nextTick,
  onUnmounted,
  watch 
} from 'vue'; 

import Sortable from 'sortablejs'; 

import { 
  getCustomEvents,
  saveCustomEvents
} from '../utils/storage'; 

// ========== 状态管理（State Management） ==========

const isModalOpen = ref(false); 
const modalTitle = ref('添加自定义倒计时'); 
const activeEventData = ref(null); 
const eventForm = ref({ year: '', month: '', day: '', hour: '', minute: '', second: '', name: '' }); 
const valueBeforeFocus = ref(''); 
const events = ref([]); 
const customCounter = ref(1); 
const activeMenu = ref(null); 
const eventsListRef = ref(null); 
let sortableInstance = null; 
const fontStyles = ref({});
const elementRefs = ref({});
let resizeObserver = null; 
const MAX_FONT_SIZE = 16; 
const MIN_FONT_SIZE = 9;  

const sortOrder = ref('manual'); 
const isMultiSelectMode = ref(false);
const selectedEventIds = ref(new Set());
const isMarqueeSelecting = ref(false); 
const marqueeStartPos = ref({ x: 0, y: 0 }); 
const marqueeBox = ref({ x: 0, y: 0, width: 0, height: 0 }); 
const eventItemRefs = ref({});

const hoveredEventId = ref(null);
const mousePosition = ref({ x: 0, y: 0 });
const showOperationHint = ref(false);
let operationHintTimer = null;
let operationHintHideTimer = null;
const pendingCopyId = ref(null);
const pendingDeleteId = ref(null);

// ========== DOM 引用 ==========

const formYearRef = ref(null);
const formMonthRef = ref(null);
const formDayRef = ref(null);
const formHourRef = ref(null);
const formMinuteRef = ref(null);
const formSecondRef = ref(null);
const formNameRef = ref(null);
const formRefs = { year: formYearRef, month: formMonthRef, day: formDayRef, hour: formHourRef, minute: formMinuteRef, second: formSecondRef, name: formNameRef };

// ========== 配置与常量 ==========

const fieldOrder = [ 'year', 'month', 'day', 'hour', 'minute', 'second', 'name' ];
const fieldConfig = {
  year: { maxLength: 6, min: -99999, max: 99999 },
  month: { maxLength: 2, min: 1, max: 12 },
  day: { maxLength: 2, min: 1, get max() { return getDaysInMonth(eventForm.value.year, eventForm.value.month); } },
  hour: { maxLength: 2, min: 0, max: 23 },
  minute: { maxLength: 2, min: 0, max: 59 },
  second: { maxLength: 2, min: 0, max: 59 },
  name: {}
};
const unitOptions = [ { value: 'year', label: '年' }, { value: 'month', label: '月' }, { value: 'week', label: '周' }, { value: 'day', label: '天' }, { value: 'hour', label: '时' }, { value: 'minute', label: '分' }, { value: 'second', label: '秒' } ];
const precisionOptions = [ { value: 'combo', label: '0:0' }, { value: 0, label: '0' }, { value: 1, label: '0.0' }, { value: 2, label: '0.00' } ];
const unitLabels = { day: '天', hour: '小时', minute: '分钟', second: '秒', week: '周', month: '个月', year: '年' };

// ========== 核心逻辑：工具函数 ==========

function getDaysInMonth(year, month) { const y = Number(year) || new Date().getFullYear(); const m = Number(month) || 1; return new Date(y, m, 0).getDate(); }
function getCurrentDateTime() { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() }; }
function formatDateTimeDesc(year, month, day, hour, minute, second) { const yearNum = parseInt(year); const yearDisplay = yearNum < 0 ? `公元前${Math.abs(yearNum)}年` : `${yearNum}年`; return `${yearDisplay}${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日 ${String(hour || 0).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}:${String(second || 0).padStart(2, '0')}`; }
const getEventDateObject = (event) => { const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (!match) return new Date(0); const [, year, month, day] = match.map(Number); const timeStr = `${event.hour || 0}:${event.minute || 0}:${event.second || 0}`; const [hour = 0, minute = 0, second = 0] = timeStr.split(':').map(Number); const d = new Date(0); d.setUTCFullYear(year, month - 1, day); d.setUTCHours(hour, minute, second, 0); return d; }

// ========== 核心逻辑：输入处理与交互 ==========

const formInteractionHandler = {
  onInput(event, field) { let value = event.target.value; const config = fieldConfig[field]; if (field === 'year') { value = value.replace(/[^0-9-]/g, ''); if (value.lastIndexOf('-') > 0) { value = value.replace(/-/g, (match, offset) => offset === 0 ? match : ''); } } else if (field !== 'name') { value = value.replace(/\D/g, ''); } if (config.maxLength && value.length > config.maxLength) { value = value.slice(0, config.maxLength); } eventForm.value[field] = value; if (field !== 'name' && value.length >= config.maxLength) { const currentIndex = fieldOrder.indexOf(field); const nextField = fieldOrder[currentIndex + 1]; if (nextField) { formRefs[nextField].value?.focus(); } } },
  onKeydown(event, field) { const { key, ctrlKey, metaKey, shiftKey, target } = event; const config = fieldConfig[field]; const navigate = (direction) => { event.preventDefault(); const currentIndex = fieldOrder.indexOf(field); const nextIndex = (currentIndex + direction + fieldOrder.length) % fieldOrder.length; const nextFieldKey = fieldOrder[nextIndex]; formRefs[nextFieldKey].value?.focus(); }; const adjustValue = (delta) => { if (field === 'name') return; event.preventDefault(); let numValue = Number(eventForm.value[field]) || 0; numValue += delta; const { min, max } = config; const maxValue = typeof max === 'function' ? max() : max; if (numValue > maxValue) numValue = min; if (numValue < min) numValue = maxValue; eventForm.value[field] = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); }; switch (key) { case 'Enter': if (ctrlKey || metaKey) { event.preventDefault(); saveEvent(); } else if (field === 'name') { event.preventDefault(); saveEvent(); } else { navigate(1); } break; case 'Tab': navigate(shiftKey ? -1 : 1); break; case 'ArrowLeft': if (ctrlKey || (target.selectionStart === 0 && target.selectionEnd === 0)) { navigate(-1); } break; case 'ArrowRight': if (ctrlKey || (target.selectionStart === target.value.length)) { navigate(1); } break; case 'ArrowUp': adjustValue(1); break; case 'ArrowDown': adjustValue(-1); break; case 'Escape': case 'Esc': event.preventDefault(); event.stopPropagation(); eventForm.value[field] = valueBeforeFocus.value; target.blur(); break; default: if (field !== 'name' && !/^[0-9]$/.test(key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key) && !ctrlKey && !metaKey) { if (!(field === 'year' && key === '-' && target.selectionStart === 0 && !eventForm.value.year.includes('-'))) { event.preventDefault(); } } break; } },
  onWheel(event, field) { if (field === 'name') return; const delta = event.deltaY < 0 ? 1 : -1; let numValue = Number(eventForm.value[field]) || 0; numValue += delta; const { min, max } = fieldConfig[field]; const maxValue = typeof max === 'function' ? max() : max; if (numValue > maxValue) numValue = min; if (numValue < min) numValue = maxValue; eventForm.value[field] = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); },
  onFocus(event, field) { valueBeforeFocus.value = eventForm.value[field]; if (!eventForm.value[field] && field !== 'name') { const current = getCurrentDateTime(); eventForm.value[field] = field === 'year' ? String(current[field]) : String(current[field]).padStart(2, '0'); } nextTick(() => event.target.select()); },
  onBlur(field) { if (field === 'name' || !eventForm.value[field]) return; let value = eventForm.value[field]; if (field === 'year' && (value === '-' || value === '-0')) { eventForm.value[field] = ''; return; } if (field !== 'year' && value.length === 1) { value = '0' + value; } let numValue = Number(value); const { min, max } = fieldConfig[field]; const maxValue = typeof max === 'function' ? max() : max; if (numValue < min) numValue = min; if (numValue > maxValue) numValue = maxValue; const finalValue = field === 'year' ? String(numValue) : String(numValue).padStart(2, '0'); if (finalValue !== eventForm.value[field]) { eventForm.value[field] = finalValue; } }
};
const isFormValid = computed(() => { const form = eventForm.value; if (!form.year || form.year === '-' || form.year === '-0' || isNaN(+form.year) || +form.year < -99999 || +form.year > 99999) { return false; } if (!form.month || +form.month < 1 || +form.month > 12) { return false; } if (!form.day || +form.day < 1 || +form.day > getDaysInMonth(form.year, form.month)) { return false; } if (form.hour === '' || +form.hour < 0 || +form.hour > 23) { return false; } if (form.minute === '' || +form.minute < 0 || +form.minute > 59) { return false; } if (form.second === '' || +form.second < 0 || +form.second > 59) { return false; } return true; });

// ========== 核心逻辑：弹窗控制 ==========

function openAddModal() { modalTitle.value = '添加自定义倒计时'; activeEventData.value = { id: `new_${Date.now()}`, unit: 'day', decimalPrecision: 0 }; Object.keys(eventForm.value).forEach(k => eventForm.value[k] = ''); isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
function handleEdit(event) { activeMenu.value = null; modalTitle.value = '编辑事件'; activeEventData.value = { ...event }; const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (match) { const [, y, m, d] = match; Object.assign(eventForm.value, { ...event, year: y, month: m, day: d }); } isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
function handleCopy(eventToCopy) { activeMenu.value = null; modalTitle.value = '复制并新增事件'; const newEventData = { ...eventToCopy, id: `new_${Date.now()}`, name: `${eventToCopy.name} - 副本` }; activeEventData.value = newEventData; const match = newEventData.date.match(/^(-?\d+)-(\d+)-(\d+)$/); if (match) { const [, y, m, d] = match; Object.assign(eventForm.value, { ...newEventData, year: y, month: m, day: d }); } isModalOpen.value = true; nextTick(() => formRefs.year.value?.focus()); }
function closeModal() { isModalOpen.value = false; activeEventData.value = null; }

// ========== 核心逻辑：数据持久化 ==========

function saveEvent() { if (!isFormValid.value) { alert('请填写完整且合法的时间'); return; } const f = eventForm.value; const newEvent = { ...activeEventData.value, name: f.name || `自定义${customCounter.value}`, date: `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`, hour: String(f.hour), minute: String(f.minute), second: String(f.second) }; const existingIndex = events.value.findIndex(e => e.id === newEvent.id); if (existingIndex !== -1) { events.value[existingIndex] = newEvent; } else { newEvent.id = Date.now(); events.value.unshift(newEvent); if (!f.name) customCounter.value++; } saveCustomEvents(events.value); updateAllEventsDisplay(); closeModal(); }
function handleDelete(id) { activeMenu.value = null; events.value = events.value.filter(e => e.id !== id); saveCustomEvents(events.value); updateAllEventsDisplay(); if (pendingDeleteId.value === id) { pendingDeleteId.value = null; } }
function handleMenuDelete(id) { if (confirm('确定要删除这个事件吗？')) { handleDelete(id); } }

// ========== 新增与修改：排序、多选和框选逻辑 ==========

function cycleSortOrder() { const orderCycle = { manual: 'asc', asc: 'desc', desc: 'manual' }; sortOrder.value = orderCycle[sortOrder.value]; if (sortOrder.value === 'manual') { const savedEvents = getCustomEvents(); events.value = savedEvents.map(event => { const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/); return { ...event, finalDisplay: '', dateTimeDesc: match ? formatDateTimeDesc(match[1], match[2], match[3], event.hour, event.minute, event.second) : '' }; }); if (sortableInstance) { sortableInstance.option('disabled', false); } } else { events.value.sort((a, b) => { const dateA = getEventDateObject(a); const dateB = getEventDateObject(b); return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA; }); if (sortableInstance) { sortableInstance.option('disabled', true); } } nextTick(updateAllEventsDisplay); }
function toggleMultiSelectMode() { isMultiSelectMode.value = !isMultiSelectMode.value; if (!isMultiSelectMode.value) { selectedEventIds.value.clear(); } updateAllEventsDisplay(); }
function handleItemClick(event) { if (!isMultiSelectMode.value) return; if (selectedEventIds.value.has(event.id)) { selectedEventIds.value.delete(event.id); } else { selectedEventIds.value.add(event.id); } updateAllEventsDisplay(); }
function bulkDelete() { if (selectedEventIds.value.size === 0) return; if (confirm(`您确定要删除选中的 ${selectedEventIds.value.size} 个倒计时吗？此操作不可撤销。`)) { events.value = events.value.filter(event => !selectedEventIds.value.has(event.id)); saveCustomEvents(events.value); selectedEventIds.value.clear(); isMultiSelectMode.value = false; updateAllEventsDisplay(); } }

// ========== 【重构后】核心逻辑：倒计时显示与更新 ==========

// [新增] 主时钟循环的ID
let animationFrameId = null;

// [新增] 计算单个事件的有效刷新间隔（毫秒）
function getEffectiveInterval(event) {
  // 对于组合模式或单位为秒的，刷新频率最快，为1秒
  if (event.decimalPrecision === 'combo' || event.unit === 'second') {
    return 1000;
  }

  const precision = event.decimalPrecision || 0;
  // 如果是整数显示，大部分单位的最小变动大于1秒
  if (precision === 0) {
    switch(event.unit) {
      case 'minute': return 60 * 1000;
      case 'hour':   return 60 * 60 * 1000;
      // 对于天及以上单位，整数变化间隔很长，但为简单起见，仍可设为1秒刷新，
      // 因为主循环成本很低。也可以设为更长的间隔如1分钟。
      default:       return 1000; 
    }
  }

  // 核心：计算带小数的间隔
  const factor = Math.pow(10, -precision); // e.g., 精度2 -> 0.01
  let unitMillis;
  switch(event.unit) {
    case 'minute': unitMillis = 60 * 1000; break;
    case 'hour':   unitMillis = 60 * 60 * 1000; break;
    case 'day':    unitMillis = 24 * 60 * 60 * 1000; break;
    case 'week':   unitMillis = 7 * 24 * 60 * 60 * 1000; break;
    // 对月和年使用平均值进行估算，足够精确
    case 'month':  unitMillis = 30.44 * 24 * 60 * 60 * 1000; break;
    case 'year':   unitMillis = 365.24 * 24 * 60 * 60 * 1000; break;
    default:       unitMillis = 1000;
  }
  
  // 返回计算出的间隔，但最小不低于50毫秒，防止过于频繁的计算
  return Math.max(50, factor * unitMillis);
}


function calculateCustomCountdown(targetDateStr, targetTime, now, unit, decimalPrecision) { try { const match = targetDateStr.match(/^(-?\d+)-(\d+)-(\d+)$/); if (!match) return { value: 0, isPast: false }; const [, year, month, day] = match.map(Number); const [hour = 0, minute = 0, second = 0] = targetTime.split(':').map(Number); const target = new Date(); target.setFullYear(year, month - 1, day); target.setHours(hour, minute, second, 0); const current = new Date(now); const isPast = target < current; const [start, end] = isPast ? [target, current] : [current, target]; let value; switch (unit) { case 'year': { let fullYears = end.getFullYear() - start.getFullYear(); const anniversary = new Date(start); anniversary.setFullYear(end.getFullYear()); if (end < anniversary) fullYears--; const lastAnniversary = new Date(start); lastAnniversary.setFullYear(start.getFullYear() + fullYears); const nextAnniversary = new Date(lastAnniversary); nextAnniversary.setFullYear(lastAnniversary.getFullYear() + 1); const durationOfLastYear = nextAnniversary.getTime() - lastAnniversary.getTime(); const timeIntoLastYear = end.getTime() - lastAnniversary.getTime(); value = fullYears + (timeIntoLastYear / durationOfLastYear); break; } case 'month': { let fullMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()); const anniversary = new Date(start); anniversary.setMonth(anniversary.getMonth() + fullMonths); if (end < anniversary) fullMonths--; const lastAnniversary = new Date(start); lastAnniversary.setMonth(start.getMonth() + fullMonths); const nextAnniversary = new Date(lastAnniversary); nextAnniversary.setMonth(lastAnniversary.getMonth() + 1); const durationOfLastMonth = nextAnniversary.getTime() - lastAnniversary.getTime(); const timeIntoLastMonth = end.getTime() - lastAnniversary.getTime(); value = fullMonths + (timeIntoLastMonth / durationOfLastMonth); break; } case 'week': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24 * 7); break; case 'day': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24); break; case 'hour': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60); break; case 'minute': value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60); break; case 'second': value = Math.abs(target.getTime() - current.getTime()) / 1000; break; default: value = Math.abs(target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24); } return { value: decimalPrecision == null ? value : parseFloat(value.toFixed(decimalPrecision)), isPast }; } catch (error) { return { value: 0, isPast: false }; } }
function getCustomComboDisplay(targetDateStr, targetTime, now) { try { const match = targetDateStr.match(/^(-?\d+)-(\d+)-(\d+)$/); if (!match) return '解析错误'; const [, year, month, day] = match.map(Number); const [hour = 0, minute = 0, second = 0] = targetTime.split(':').map(Number); const target = new Date(); target.setFullYear(year, month - 1, day); target.setHours(hour, minute, second, 0); const current = new Date(now); let isPast = target < current; let [start, end] = isPast ? [target, current] : [current, target]; let years = end.getFullYear() - start.getFullYear(), months = end.getMonth() - start.getMonth(), days = end.getDate() - start.getDate(), hours = end.getHours() - start.getHours(), minutes = end.getMinutes() - start.getMinutes(), seconds = end.getSeconds() - start.getSeconds(); if (seconds < 0) { seconds += 60; minutes--; } if (minutes < 0) { minutes += 60; hours--; } if (hours < 0) { hours += 24; days--; } if (days < 0) { const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0); days += prevMonth.getDate(); months--; } if (months < 0) { months += 12; years--; } const timeUnits = [ { num: years, unit: '年' }, { num: months, unit: '个月' }, { num: days, unit: '天' }, { num: hours, unit: '小时' }, { num: minutes, unit: '分' }, { num: seconds, unit: '秒' } ]; let firstNonZero = 0; while (firstNonZero < timeUnits.length - 1 && timeUnits[firstNonZero].num === 0) { firstNonZero++; } let trimmed = timeUnits.slice(firstNonZero); let lastNonZero = trimmed.length - 1; while (lastNonZero >= 0 && trimmed[lastNonZero].num === 0) { lastNonZero--; } let core = trimmed.slice(0, lastNonZero + 1); let endZeroCount = trimmed.length - 1 - lastNonZero; let outArr = []; for (let i = 0; i < core.length;) { if (core[i].num > 0) { outArr.push(` <span class="combo-num">${core[i].num}</span> ${core[i].unit}`); i++; } else { let k = i; while (k < core.length && core[k].num === 0) k++; outArr.push(' 零'); i = k; } } if (endZeroCount) outArr.push(' 整'); if (outArr.length === 0) outArr.push(' <span class="combo-num">0</span> 秒'); return (isPast ? '已过' : '还有') + outArr.join(''); } catch (error) { return '计算错误'; } }

// [重构] 只更新单个事件的显示
function updateSingleEventDisplay(event, now = new Date()) {
  const targetTime = `${(event.hour || '0').padStart(2, '0')}:${(event.minute || '0').padStart(2, '0')}:${(event.second || '0').padStart(2, '0')}`;
  
  if (event.decimalPrecision === 'combo') {
    event.finalDisplay = getCustomComboDisplay(event.date, targetTime, now);
  } else {
    const result = calculateCustomCountdown(event.date, targetTime, now, event.unit, event.decimalPrecision);
    const prefix = result.isPast ? '已过 ' : '还有 ';
    event.finalDisplay = `${prefix}<strong class="combo-num">${result.value.toFixed(event.decimalPrecision)}</strong> ${unitLabels[event.unit]}`;
  }

  // 日期描述一般不变，但为了逻辑统一也放在这里
  if (event.date) {
    const match = event.date.match(/^(-?\d+)-(\d+)-(\d+)$/);
    if (match) {
      event.dateTimeDesc = formatDateTimeDesc(match[1], match[2], match[3], event.hour, event.minute, event.second);
    }
  }

  // 触发字体大小的重新计算
  nextTick(updateAllFontSizes);
}

// [重构] 更新所有事件（用于初始化和强制刷新）
function updateAllEventsDisplay() {
  const now = new Date();
  events.value.forEach(event => updateSingleEventDisplay(event, now));
}

// [新增] 主时钟循环
function mainLoop() {
  const now = Date.now();
  events.value.forEach(event => {
    // 检查是否到了该事件的更新时间
    if (!event.nextUpdateTime || now >= event.nextUpdateTime) {
      // 更新显示
      updateSingleEventDisplay(event, new Date(now));
      
      // 计算并设置下一次的更新时间
      const interval = getEffectiveInterval(event);
      event.nextUpdateTime = now + interval;
    }
  });
  
  animationFrameId = requestAnimationFrame(mainLoop);
}

// ========== 字号自适应逻辑 ==========

const setElementRef = (el, eventId, type) => { if (el) { if (!elementRefs.value[eventId]) { elementRefs.value[eventId] = {}; } elementRefs.value[eventId][type] = el; } };
const adjustFontSize = (element) => { if (!element) { return {}; } let currentFontSize = MAX_FONT_SIZE; element.style.fontSize = `${currentFontSize}px`; while (element.scrollWidth > element.clientWidth && currentFontSize > MIN_FONT_SIZE) { currentFontSize -= 0.5; element.style.fontSize = `${currentFontSize}px`; } return { fontSize: `${currentFontSize}px` }; };
const updateAllFontSizes = () => { for (const eventId in elementRefs.value) { const refs = elementRefs.value[eventId]; if (refs) { if (!fontStyles.value[eventId]) { fontStyles.value[eventId] = {}; } if (refs.date) { fontStyles.value[eventId].date = adjustFontSize(refs.date); } if (refs.countdown) { fontStyles.value[eventId].countdown = adjustFontSize(refs.countdown); } } } };

// ========== 交互处理（单位/精度切换、菜单等） ==========

function toggleMenu(id) { activeMenu.value = activeMenu.value === id ? null : id; }
function handleUnitChange(id, unit) { const event = events.value.find(e => e.id === id); if (event) { event.unit = unit; if (unit === 'second' && event.decimalPrecision !== 'combo' && event.decimalPrecision > 0) { event.decimalPrecision = 0; } if (unit === 'minute' && event.decimalPrecision === 2) { event.decimalPrecision = 1; } saveCustomEvents(events.value); event.nextUpdateTime = 0; updateSingleEventDisplay(event); } }
function handlePrecisionChange(id, precision) { const event = events.value.find(e => e.id === id); if (event) { event.decimalPrecision = precision; saveCustomEvents(events.value); event.nextUpdateTime = 0; updateSingleEventDisplay(event); } }
const isDecimalDisabled = (unit, decimalValue) => (unit === 'second' && decimalValue !== 'combo' && decimalValue > 0) || (unit === 'minute' && decimalValue === 2);
function handleEventMouseEnter(eventId) { if (window.innerWidth <= 800) return; if (pendingCopyId.value && pendingCopyId.value !== eventId) { pendingCopyId.value = null; } if (pendingDeleteId.value && pendingDeleteId.value !== eventId) { pendingDeleteId.value = null; } hoveredEventId.value = eventId; if (operationHintTimer) clearTimeout(operationHintTimer); if (operationHintHideTimer) clearTimeout(operationHintHideTimer); operationHintTimer = setTimeout(() => { showOperationHint.value = true; operationHintHideTimer = setTimeout(() => { showOperationHint.value = false; }, 3000); }, 500); }
function handleEventMouseLeave() { if (window.innerWidth <= 800) return; hoveredEventId.value = null; showOperationHint.value = false; if (operationHintTimer) clearTimeout(operationHintTimer); if (operationHintHideTimer) clearTimeout(operationHintHideTimer); pendingCopyId.value = null; pendingDeleteId.value = null; }
function handleEventMouseMove(e) { if (window.innerWidth <= 800) return; mousePosition.value = { x: e.clientX + 15, y: e.clientY - 30 }; }

// ========== 框选功能相关函数 ==========
function checkIntersection(rect1, rect2) { return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom); }
function startMarquee(clientX, clientY, e) { if (!isMultiSelectMode.value) return; const ignoredSelectors = [ '.event-container', '.custom-countdown-header', 'button', 'a', 'input', 'select', 'textarea', '.modal-overlay' ]; if (ignoredSelectors.some(selector => e.target.closest(selector))) { return; } e.preventDefault(); e.stopPropagation(); isMarqueeSelecting.value = true; marqueeStartPos.value = { x: clientX, y: clientY }; }
function moveMarquee(clientX, clientY, e) { if (!isMarqueeSelecting.value) return; e.preventDefault(); e.stopPropagation(); const start = marqueeStartPos.value; const end = { x: clientX, y: clientY }; marqueeBox.value = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y) }; const marqueeRect = { left: marqueeBox.value.x, top: marqueeBox.value.y, right: marqueeBox.value.x + marqueeBox.value.width, bottom: marqueeBox.value.y + marqueeBox.value.height }; for (const id in eventItemRefs.value) { const itemEl = eventItemRefs.value[id]; if (itemEl) { const itemRect = itemEl.getBoundingClientRect(); if (checkIntersection(marqueeRect, itemRect)) { selectedEventIds.value.add(Number(id)); } } } updateAllEventsDisplay(); }
function endMarquee() { if (!isMarqueeSelecting.value) return; isMarqueeSelecting.value = false; updateAllEventsDisplay(); }
const handleMouseDown = (e) => { if (e.button === 0) startMarquee(e.clientX, e.clientY, e); };
const handleMouseMove = (e) => moveMarquee(e.clientX, e.clientY, e);
const handleMouseUp = () => endMarquee();
const handleTouchStart = (e) => { if (e.touches.length === 1) startMarquee(e.touches[0].clientX, e.touches[0].clientY, e); };
const handleTouchMove = (e) => { if (e.touches.length === 1) moveMarquee(e.touches[0].clientX, e.touches[0].clientY, e); };
const handleTouchEnd = () => endMarquee();

// ========== 快捷键处理 ==========
const handleEditShortcut = (event) => handleEdit(event);
const handleCopyShortcut = (event) => { if (pendingCopyId.value === event.id) { handleCopy(event); pendingCopyId.value = null; } else { pendingCopyId.value = event.id; pendingDeleteId.value = null; setTimeout(() => { if (pendingCopyId.value === event.id) pendingCopyId.value = null; }, 3000); } };
const handleDeleteShortcut = (event) => { if (pendingDeleteId.value === event.id) { handleDelete(event.id); pendingDeleteId.value = null; } else { pendingDeleteId.value = event.id; pendingCopyId.value = null; setTimeout(() => { if (pendingDeleteId.value === event.id) pendingDeleteId.value = null; }, 3000); } };
const keyActionMap = { ' ': handleEditShortcut, '/': handleEditShortcut, 'Insert': handleCopyShortcut, '+': handleCopyShortcut, 'Delete': handleDeleteShortcut, '-': handleDeleteShortcut };
function handleGlobalKeydown(e) { if (isModalOpen.value && (e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (isFormValid.value) saveEvent(); return; } if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); if (activeMenu.value) { activeMenu.value = null; return; } if (pendingCopyId.value || pendingDeleteId.value) { pendingCopyId.value = null; pendingDeleteId.value = null; return; } const activeEl = document.activeElement; const isInModal = activeEl && activeEl.closest('.modal-content'); if (isModalOpen.value && !isInModal) { closeModal(); return; } if (isMultiSelectMode.value) { toggleMultiSelectMode(); return; } return; } const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'); if (isInputFocused || !hoveredEventId.value) return; const event = events.value.find(e => e.id === hoveredEventId.value); if (!event) return; const action = keyActionMap[e.key]; if (action) { e.preventDefault(); showOperationHint.value = false; action(event); } }
function handleGlobalClickOrTouch(e) { if (!e.target.closest('.menu-container')) { activeMenu.value = null; } }

// ========== 生命周期钩子 ==========
onMounted(() => {
  const savedEvents = getCustomEvents();
  events.value = savedEvents.map(event => ({
    ...event,
    finalDisplay: '',
    dateTimeDesc: '',
    nextUpdateTime: 0 // [新增] 初始化下次更新时间
  }));
  
  customCounter.value = Math.max(0, ...savedEvents.map(e => parseInt(e.name.match(/^自定义(\d+)$/)?.[1] || 0))) + 1;
  
  // [修改] 使用新的全体更新函数进行首次渲染
  updateAllEventsDisplay();
  
  // [DEPRECATED] 旧的定时器逻辑，保留作为备份
  // updateTimer = setInterval(updateCountdowns, 1000);
  
  // [新增] 启动新的主时钟循环
  mainLoop();

  if (eventsListRef.value) { resizeObserver = new ResizeObserver(() => { updateAllFontSizes(); }); resizeObserver.observe(eventsListRef.value); }
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('click', handleGlobalClickOrTouch, true);
  document.addEventListener('touchstart', handleGlobalClickOrTouch, true);
  nextTick(() => {
    if (eventsListRef.value) {
      const sortableOptions = { animation: 220, handle: '.drag-handle, .drag-blank-area', ghostClass: 'drag-ghost', chosenClass: 'drag-chosen', dragClass: 'drag-dragging', onEnd: (evt) => { sortOrder.value = 'manual'; if (sortableInstance) { sortableInstance.option('disabled', false); } if (evt.oldIndex != null && evt.newIndex != null && evt.oldIndex !== evt.newIndex) { const moved = events.value.splice(evt.oldIndex, 1)[0]; events.value.splice(evt.newIndex, 0, moved); saveCustomEvents(events.value); } } };
      if (window.innerWidth <= 800) { sortableOptions.delay = 300; sortableOptions.delayOnTouchOnly = true; }
      sortableInstance = Sortable.create(eventsListRef.value, sortableOptions);
    }
  });

  watch(isMultiSelectMode, (isMulti) => {
    if (isMulti) {
      window.addEventListener('mousedown', handleMouseDown, true);
      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);
      window.addEventListener('touchstart', handleTouchStart, true);
      window.addEventListener('touchmove', handleTouchMove, true);
      window.addEventListener('touchend', handleTouchEnd, true);
    } else {
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      window.removeEventListener('touchstart', handleTouchStart, true);
      window.removeEventListener('touchmove', handleTouchMove, true);
      window.removeEventListener('touchend', handleTouchEnd, true);
      isMarqueeSelecting.value = false;
    }
  }, { immediate: false });
});

onUnmounted(() => {
  // [DEPRECATED]
  // if (updateTimer) clearInterval(updateTimer);
  
  // [新增] 停止主时钟循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('click', handleGlobalClickOrTouch, true);
  document.removeEventListener('touchstart', handleGlobalClickOrTouch, true);
  
  window.removeEventListener('mousedown', handleMouseDown, true);
  window.removeEventListener('mousemove', handleMouseMove, true);
  window.removeEventListener('mouseup', handleMouseUp, true);
  window.removeEventListener('touchstart', handleTouchStart, true);
  window.removeEventListener('touchmove', handleTouchMove, true);
  window.removeEventListener('touchend', handleTouchEnd, true);

  if (sortableInstance) sortableInstance.destroy();
  if (operationHintTimer) clearTimeout(operationHintTimer);
  if (operationHintHideTimer) clearTimeout(operationHintHideTimer);
  if (resizeObserver) { resizeObserver.disconnect(); }
});
</script>

<style scoped>
/* ========== 组件容器与标题 ========== */

.custom-countdown {
  margin-bottom: 8px;
}

.custom-countdown-header.three-column-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 800px) {
  .custom-countdown-header {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

.header-zone-left {
  justify-self: start;
}

.header-zone-center {
  justify-self: center;
}

.header-zone-right {
  justify-self: end;
}

.title {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
  margin: 0;
}

@media (max-width: 800px) {
  .title {
    justify-self: center;
  }
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

@media (max-width: 800px) {
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}

/* ========== 按钮通用与特定样式 ========== */

.action-btn {
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.joined-btn.action-btn svg {
  vertical-align: middle;
}

.action-btn.joined-btn {
  border-radius: 0;
}

.action-btn:hover {
  background-color: var(--bg-quaternary);
  color: var(--text-primary);
}

.action-btn.active {
  background-color: var(--green-primary);
  color: var(--bg-primary);
  border-color: var(--green-primary);
}

.bulk-delete-btn {
  background-color: #5f2120;
  color: #ffcdd2;
  border: 1px solid #a13531;
  height: 36px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
}

.bulk-delete-btn:hover {
  background-color: #d32f2f;
  color: white;
  border-color: #d32f2f;
}

.add-new-event-btn {
  height: 36px;
  font-size: 14px;
}

/* ========== 事件列表及条目 ========== */

.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-container {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 15px;
  position: relative;
  overflow: visible;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: default;
}

.event-container.is-selected {
  background: var(--bg-quaternary);
  box-shadow: 0 0 0 2px var(--green-primary);
  border-color: var(--green-primary);
}

@media (min-width: 801px) {
  .event-container:not(.is-selected):hover {
    background: var(--bg-quaternary);
  }
  .event-container.is-selected {
    cursor: pointer;
  }
}

.event-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 1fr minmax(320px, 2fr) 40px;
  gap: 20px;
  align-items: center;
  margin-bottom: 15px;
}

@media (max-width: 800px) {
  .event-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 100%;
    gap: 8px;
    text-align: center;
  }
}

.event-date-column,
.event-name-column,
.event-countdown-column {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  text-align: center;
  transition: color 0.2s;
  min-height: 24px;
}

@media (max-width: 800px) {
  .event-date-column,
  .event-name-column,
  .event-countdown-column {
    width: 100%;
    text-align: center !important;
    justify-content: center;
  }
}

.event-date-column,
.event-countdown-column {
  white-space: nowrap;
}

.event-name-column {
  white-space: normal;
  word-break: break-all;
}

:deep(.event-countdown-column strong),
:deep(.event-countdown-column .combo-num) {
  color: var(--green-primary);
  font-weight: 600;
  margin: 0 4px;
  font-style: normal;
  transition: color 0.2s;
}

.empty-tip {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 20px;
}

/* ========== 弹窗样式 ========== */

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 90vw;
}

@media (max-width: 800px) {
  .modal-content {
    min-width: 90vw;
  }
}

.modal-title {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-align: center;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.modal-form .input-group {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: center;
  width: 100%;
  margin-bottom: 7px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.button-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.button-secondary:hover {
  background: var(--border-color);
}

.input {
  height: 40px;
  min-height: 40px;
  line-height: 40px;
  width: 96px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  border-color: var(--green-primary);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.date-separator {
  width: 10px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0 2px;
}

.event-name-input {
  width: 324px;
  min-width: 120px;
  max-width: 100%;
  margin: 0;
}

@media (max-width: 800px) {
  .event-name-input {
    min-width: calc(90vw - 80px);
  }
}

/* ========== 拖拽与菜单 ========== */

.desktop-only { display: none; }
.mobile-only { display: block; position: absolute; left: 0; top: 0; bottom: 0; right: 0; z-index: 5; cursor: move; }

@media (min-width: 801px) {
  .desktop-only { display: flex !important; }
  .mobile-only { display: none !important; }
}

.drag-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  color: var(--text-tertiary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, background 0.2s, transform 0.2s;
  z-index: 10;
}

@media (min-width: 801px) {
  .event-container:hover .drag-handle {
    opacity: 1;
  }
}

.drag-handle-left { left: -20px; }
.drag-handle-right { right: -20px; }

.drag-handle:hover {
  color: var(--green-primary);
  background: var(--bg-tertiary);
  transform: translateY(-50%) scale(1.1);
}

.drag-chosen,
.drag-dragging {
  box-shadow: 0 8px 40px rgba(52, 206, 99, .22), 0 2px 18px #0004;
  transform: scale(1.03);
  z-index: 100;
  cursor: move;
}

.drag-ghost {
  opacity: 0.2 !important;
  background: var(--bg-tertiary);
  box-shadow: none !important;
  transform: scale(1) !important;
}

.menu-container.absolute-menu {
  position: absolute;
  top: -8px;
  right: -10px;
  z-index: 10;
}

.menu-btn {
  width: 32px; height: 32px; border: none; border-radius: 8px;
  background: none; color: var(--text-secondary); cursor: pointer;
  font-size: 16px; font-weight: bold; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}

.menu-btn:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.dropdown-menu {
  position: absolute; top: 100%; right: 0;
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 1000; min-width: 80px; padding: 4px 0;
}

.menu-item {
  width: 100%; padding: 8px 16px; border: none; background: none;
  color: var(--text-primary); font-size: 14px; text-align: left;
  cursor: pointer; transition: background-color 0.2s;
  font-family: inherit;
}

.menu-item:hover { background: var(--bg-tertiary); }
.menu-item.delete { color: #f44336; }
.menu-item.delete:hover { background: rgba(244,67,54,.1); }

/* ========== 按钮组 ========== */

.button-row.horizontal-between {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 8px;
  margin-bottom: 8px;
}

@media (max-width: 800px) {
  .button-row.horizontal-between {
    flex-direction: column !important;
    align-items: center !important;
    gap: 8px !important;
  }
}

.joined-btn-group { display: flex; }

@media (max-width: 800px) {
  .joined-btn-group {
    justify-content: center !important;
    width: 100%;
  }
}

.joined-btn {
  border-radius: 0; margin-left: -1px; width: 48px; height: 28px;
  font-weight: 600; border: 1px solid var(--border-color);
  background: var(--bg-quaternary); color: var(--text-secondary);
  font-size: 12px; cursor: pointer; transition: all 0.1s;
}

.joined-btn:first-child { border-top-left-radius: 14px; border-bottom-left-radius: 14px; margin-left: 0; }
.joined-btn:last-child { border-top-right-radius: 14px; border-bottom-right-radius: 14px; }
.joined-btn.active { background: var(--green-primary); color: var(--bg-primary); }
.joined-btn.disabled { opacity: 0.5; cursor: not-allowed; }

/* ========== 框选矩形样式 ========== */
.marquee-select-box {
  position: fixed;
  background-color: rgba(76, 175, 80, 0.2);
  border: 2px solid var(--green-primary);
  z-index: 9998;
  pointer-events: none;
}


/* ========== 交互提示与动画 ========== */

.operation-hint,
.copy-confirm-hint,
.delete-confirm-hint {
  position: fixed; padding: 6px 12px; border-radius: 6px;
  font-size: 14px; font-weight: 500; white-space: nowrap;
  pointer-events: none; z-index: 9999; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  transform: translateY(-50%);
}

.operation-hint { background: var(--bg-tertiary); opacity: 0.9; }
.hint-content { display: flex; flex-direction: column; gap: 2px; }
.hint-item { display: flex; justify-content: space-between; gap: 12px; }
.hint-key { color: var(--text-secondary); }
.hint-action { color: var(--text-primary); }
.hint-item:last-child .hint-action { color: #ff7575; }

.copy-confirm-hint { background: var(--green-primary); color: #fff; }
.delete-confirm-hint { background: #d32f2f; color: #fff; }

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

@keyframes pulse-animation {
  50% {
    background-color: var(--pulse-bg-color);
    border-color: var(--pulse-border-color);
    box-shadow: 0 0 20px 2px var(--pulse-shadow-color);
  }
}

.event-container.pending-copy {
  --pulse-bg-color: rgba(76, 175, 80, 0.1);
  --pulse-border-color: rgba(76, 175, 80, 0.5);
  --pulse-shadow-color: rgba(76, 175, 80, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
  border: 1px solid transparent;
}

.event-container.pending-delete {
  --pulse-bg-color: rgba(244, 67, 54, 0.1);
  --pulse-border-color: rgba(244, 67, 54, 0.5);
  --pulse-shadow-color: rgba(244, 67, 54, 0.3);
  animation: pulse-animation 0.5s ease-in-out infinite;
  border: 1px solid transparent;
}

.event-container.pending-copy :deep(div),
.event-container.pending-copy :deep(strong),
.event-container.pending-copy :deep(.combo-num) {
  color: var(--green-secondary) !important;
}

.event-container.pending-delete :deep(div),
.event-container.pending-delete :deep(strong),
.event-container.pending-delete :deep(.combo-num) {
  color: #f44336 !important;
}
</style>
